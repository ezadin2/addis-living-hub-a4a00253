CREATE TYPE public.app_role AS ENUM ('admin','owner','renter');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL DEFAULT '',
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended')),
  verification_status text NOT NULL DEFAULT 'not_verified' CHECK (verification_status IN ('not_verified','pending','verified','failed')),
  is_business boolean NOT NULL DEFAULT false,
  business_name text
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own or admin read profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own update profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own or admin read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  kind text NOT NULL DEFAULT 'property' CHECK (kind IN ('property','vehicle','equipment')),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Addis Ababa',
  neighborhood text NOT NULL DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  price_unit text NOT NULL DEFAULT 'month' CHECK (price_unit IN ('month','day')),
  bedrooms int NOT NULL DEFAULT 0,
  bathrooms int NOT NULL DEFAULT 0,
  size_sqm int,
  furnishing text,
  amenities text[] NOT NULL DEFAULT '{}',
  min_term int NOT NULL DEFAULT 1,
  deposit text,
  make text, model text, year int, transmission text, fuel text, seats int,
  condition text,
  with_operator boolean NOT NULL DEFAULT false,
  images text[] NOT NULL DEFAULT '{}',
  owner_name text NOT NULL DEFAULT '',
  owner_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  available boolean NOT NULL DEFAULT true,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  rejection_reason text,
  premium boolean NOT NULL DEFAULT false,
  contact_phone text,
  CONSTRAINT listings_status_check CHECK (status IN ('draft','pending','approved','rejected'))
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public approved" ON public.listings FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner insert" ON public.listings FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "owner or admin update" ON public.listings FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner or admin delete" ON public.listings FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL,
  owner_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  units int NOT NULL DEFAULT 1,
  total numeric NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  renter_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  owner_note text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'rental' CHECK (kind IN ('rental','viewing'))
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read" ON public.bookings FOR SELECT TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "renter create" ON public.bookings FOR INSERT TO authenticated WITH CHECK (renter_id = auth.uid());
CREATE POLICY "parties update" ON public.bookings FOR UPDATE TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text := coalesce(NEW.raw_user_meta_data->>'role','renter');
BEGIN
  INSERT INTO public.profiles(id, full_name, email) VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name',''), coalesce(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  IF r NOT IN ('owner','renter') THEN r := 'renter'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, r::public.app_role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _entity text, _entity_id text, _details jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_logs(actor_id, action, entity, entity_id, details) VALUES (auth.uid(), _action, _entity, _entity_id, coalesce(_details,'{}'::jsonb));
$$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text,text,text,jsonb) FROM PUBLIC, anon, authenticated;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify(_user uuid, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, body, link) VALUES (_user, _title, coalesce(_body,''), _link);
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify(uuid,text,text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.profile_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(),'admin') THEN
    IF NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.verification_status IS DISTINCT FROM OLD.verification_status OR NEW.is_business IS DISTINCT FROM OLD.is_business THEN
      PERFORM public.log_audit('profile.update', 'profile', NEW.id::text, jsonb_build_object(
        'account_status', NEW.account_status, 'verification_status', NEW.verification_status, 'is_business', NEW.is_business));
      IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
        PERFORM public.notify(NEW.id, 'Verification status updated', 'Your identity verification status is now: ' || replace(NEW.verification_status,'_',' '), '/dashboard');
      END IF;
      IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
        PERFORM public.notify(NEW.id, 'Account status updated', 'Your account is now ' || NEW.account_status, '/dashboard');
      END IF;
    END IF;
    NEW.verified := (NEW.verification_status = 'verified');
    RETURN NEW;
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    IF NOT (NEW.verification_status = 'pending' AND OLD.verification_status IN ('not_verified','failed')) THEN
      NEW.verification_status := OLD.verification_status;
    END IF;
  END IF;
  NEW.verified := OLD.verified;
  NEW.account_status := OLD.account_status;
  NEW.is_business := OLD.is_business;
  NEW.email := OLD.email;
  RETURN NEW;
END $$;
CREATE TRIGGER profile_guard BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profile_guard();

CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot change your own role'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role);
  PERFORM public.log_audit('role.set', 'user', _user_id::text, jsonb_build_object('role', _role));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.platform_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  commission_rate numeric NOT NULL DEFAULT 3 CHECK (commission_rate >= 2 AND commission_rate <= 5),
  premium_fee numeric NOT NULL DEFAULT 500 CHECK (premium_fee >= 0),
  support_email text NOT NULL DEFAULT 'support@faydarent.et',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin update" ON public.platform_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.platform_settings(id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.settings_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  PERFORM public.log_audit('settings.update', 'platform_settings', '1', jsonb_build_object('commission_rate', NEW.commission_rate, 'premium_fee', NEW.premium_fee));
  RETURN NEW;
END $$;
CREATE TRIGGER settings_audit BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.settings_audit();

CREATE TABLE public.categories (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('property','vehicle','equipment')),
  label text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories read" ON public.categories FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "categories admin insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "categories admin update" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "categories admin delete" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
INSERT INTO public.categories(id, kind, label, blurb, sort) VALUES
 ('apartment','property','Apartments','Condos and flats across the city',1),
 ('house','property','Houses','Villas, G+1 and family homes',2),
 ('room','property','Rooms & shared','Affordable rooms and shared living',3),
 ('furnished','property','Furnished rentals','Move-in ready, short or long stay',4),
 ('commercial','property','Commercial spaces','Offices, shops and studios',5),
 ('car','vehicle','Cars','Economy and executive sedans',6),
 ('suv','vehicle','SUVs & 4x4','For city and countryside trips',7),
 ('van','vehicle','Vans & minibuses','Group travel and transfers',8),
 ('truck','vehicle','Trucks','Cargo and moving',9),
 ('construction','equipment','Construction','Excavators, mixers, loaders',10),
 ('power','equipment','Power','Generators and lighting',11),
 ('event','equipment','Events','Tents, chairs, sound',12)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.listing_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(),'admin') THEN
    IF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.premium IS DISTINCT FROM OLD.premium) THEN
      IF NEW.status = 'approved' THEN NEW.rejection_reason := NULL; END IF;
      PERFORM public.log_audit('listing.' || NEW.status, 'listing', NEW.id::text, jsonb_build_object('title', NEW.title, 'reason', NEW.rejection_reason, 'premium', NEW.premium));
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM public.notify(NEW.owner_id, 'Listing ' || NEW.status, NEW.title || CASE WHEN NEW.status = 'rejected' THEN ' — ' || coalesce(NEW.rejection_reason,'see dashboard') ELSE '' END, '/owner');
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('draft','pending') THEN NEW.status := 'pending'; END IF;
    NEW.premium := false;
    NEW.views := 0;
    NEW.rejection_reason := NULL;
  ELSE
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN RAISE EXCEPTION 'Not allowed'; END IF;
    NEW.premium := OLD.premium;
    NEW.views := OLD.views;
    NEW.rejection_reason := OLD.rejection_reason;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status NOT IN ('draft','pending') THEN NEW.status := OLD.status; END IF;
    ELSIF OLD.status IN ('approved','rejected') AND (NEW.title, NEW.description, NEW.price, NEW.images, NEW.category) IS DISTINCT FROM (OLD.title, OLD.description, OLD.price, OLD.images, OLD.category) THEN
      NEW.status := 'pending';
    END IF;
  END IF;
  SELECT coalesce(nullif(full_name,''),'Owner'), verified INTO NEW.owner_name, NEW.owner_verified FROM public.profiles WHERE id = auth.uid();
  RETURN NEW;
END $$;
CREATE TRIGGER listing_guard BEFORE INSERT OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.listing_guard();

CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites read" ON public.favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own favorites insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own favorites delete" ON public.favorites FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.booking_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.listings;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO l FROM public.listings WHERE id = NEW.listing_id;
    IF l.id IS NULL OR l.status <> 'approved' OR NOT l.available THEN RAISE EXCEPTION 'This listing is not available for booking'; END IF;
    IF l.owner_id = NEW.renter_id THEN RAISE EXCEPTION 'You cannot book your own listing'; END IF;
    IF NEW.end_date < NEW.start_date THEN RAISE EXCEPTION 'End date must be after start date'; END IF;
    IF NEW.start_date < current_date THEN RAISE EXCEPTION 'Start date cannot be in the past'; END IF;
    NEW.owner_id := l.owner_id;
    NEW.status := 'pending';
    NEW.owner_note := '';
    IF l.price_unit = 'day' THEN
      NEW.units := (NEW.end_date - NEW.start_date) + 1;
    ELSE
      NEW.units := greatest(NEW.units, l.min_term);
    END IF;
    NEW.total := NEW.units * l.price;
    SELECT coalesce(nullif(full_name,''), NEW.renter_name) INTO NEW.renter_name FROM public.profiles WHERE id = NEW.renter_id;
  ELSE
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
      IF NEW.listing_id <> OLD.listing_id OR NEW.renter_id <> OLD.renter_id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.total <> OLD.total
         OR NEW.start_date <> OLD.start_date OR NEW.end_date <> OLD.end_date THEN
        RAISE EXCEPTION 'Not allowed';
      END IF;
      IF auth.uid() = OLD.renter_id AND auth.uid() IS DISTINCT FROM OLD.owner_id THEN
        IF NEW.status <> OLD.status AND NOT (NEW.status = 'cancelled' AND OLD.status IN ('pending','approved')) THEN
          RAISE EXCEPTION 'Renters can only cancel a pending or approved request';
        END IF;
        NEW.owner_note := OLD.owner_note;
      END IF;
      IF auth.uid() = OLD.owner_id THEN
        IF NEW.status <> OLD.status THEN
          IF NOT ((OLD.status = 'pending' AND NEW.status IN ('approved','declined')) OR (OLD.status = 'approved' AND NEW.status = 'completed')) THEN
            RAISE EXCEPTION 'Invalid status change';
          END IF;
        END IF;
      END IF;
    END IF;
    IF NEW.status = 'approved' AND OLD.status <> 'approved' AND NEW.kind = 'rental' THEN
      IF EXISTS (SELECT 1 FROM public.bookings b WHERE b.listing_id = NEW.listing_id AND b.id <> NEW.id AND b.kind = 'rental'
                 AND b.status IN ('approved','completed') AND daterange(b.start_date, b.end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]')) THEN
        RAISE EXCEPTION 'These dates overlap another accepted rental for this listing';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER booking_guard BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.booking_guard();

CREATE OR REPLACE FUNCTION public.booking_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  SELECT title INTO t FROM public.listings WHERE id = NEW.listing_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(NEW.owner_id, 'New ' || NEW.kind || ' request', coalesce(NEW.renter_name,'A renter') || ' requested ' || coalesce(t,'your listing'), '/owner');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(NEW.owner_id, 'Request cancelled', coalesce(t,'Listing') || ' — cancelled by renter', '/owner');
    ELSE
      PERFORM public.notify(NEW.renter_id, 'Request ' || NEW.status, coalesce(t,'Listing') || CASE WHEN NEW.owner_note <> '' THEN ' — ' || NEW.owner_note ELSE '' END, '/renter');
    END IF;
    IF public.has_role(auth.uid(),'admin') AND auth.uid() NOT IN (NEW.owner_id, NEW.renter_id) THEN
      PERFORM public.log_audit('booking.' || NEW.status, 'booking', NEW.id::text, '{}'::jsonb);
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER booking_notify AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.booking_notify();

CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  renter_id uuid NOT NULL,
  terms text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','shared','accepted','cancelled')),
  shared_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.agreements TO authenticated;
GRANT ALL ON public.agreements TO service_role;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agreement parties read" ON public.agreements FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR (renter_id = auth.uid() AND status <> 'draft') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner creates agreement" ON public.agreements FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "parties update agreement" ON public.agreements FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR renter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.agreement_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO b FROM public.bookings WHERE id = NEW.booking_id;
    IF b.id IS NULL OR b.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
    IF b.status NOT IN ('approved','completed') THEN RAISE EXCEPTION 'Accept the request before drafting an agreement'; END IF;
    NEW.listing_id := b.listing_id; NEW.owner_id := b.owner_id; NEW.renter_id := b.renter_id;
    NEW.status := 'draft'; NEW.shared_at := NULL; NEW.accepted_at := NULL;
    RETURN NEW;
  END IF;
  NEW.updated_at := now();
  IF NEW.booking_id <> OLD.booking_id OR NEW.owner_id <> OLD.owner_id OR NEW.renter_id <> OLD.renter_id OR NEW.listing_id <> OLD.listing_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF OLD.status = 'accepted' AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'An accepted agreement cannot be changed'; END IF;
  IF auth.uid() = OLD.owner_id THEN
    IF NEW.status NOT IN ('draft','shared','cancelled') THEN RAISE EXCEPTION 'Only the renter can accept'; END IF;
    IF NEW.status = 'shared' AND OLD.status <> 'shared' THEN NEW.shared_at := now(); END IF;
    IF NEW.terms <> OLD.terms AND OLD.status = 'shared' THEN NEW.status := 'draft'; NEW.shared_at := NULL; END IF;
    NEW.accepted_at := OLD.accepted_at;
  ELSIF auth.uid() = OLD.renter_id THEN
    IF NEW.terms <> OLD.terms THEN RAISE EXCEPTION 'Renters cannot edit agreement terms'; END IF;
    IF NOT (OLD.status = 'shared' AND NEW.status = 'accepted') THEN RAISE EXCEPTION 'You can only accept a shared agreement'; END IF;
    NEW.accepted_at := now();
    NEW.shared_at := OLD.shared_at;
  ELSIF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER agreement_guard BEFORE INSERT OR UPDATE ON public.agreements FOR EACH ROW EXECUTE FUNCTION public.agreement_guard();

CREATE OR REPLACE FUNCTION public.agreement_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'shared' THEN PERFORM public.notify(NEW.renter_id, 'Agreement ready to review', 'Your owner shared a rental agreement draft.', '/renter'); END IF;
    IF NEW.status = 'accepted' THEN PERFORM public.notify(NEW.owner_id, 'Agreement accepted', 'The renter accepted your rental agreement.', '/owner'); END IF;
    IF NEW.status = 'cancelled' THEN PERFORM public.notify(NEW.renter_id, 'Agreement cancelled', 'The owner cancelled the agreement.', '/renter'); END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER agreement_notify AFTER UPDATE ON public.agreements FOR EACH ROW EXECUTE FUNCTION public.agreement_notify();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  renter_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  commission_rate numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','bank_transfer','telebirr','other')),
  reference text NOT NULL DEFAULT '',
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment parties read" ON public.payments FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR renter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner or admin records payment" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.payment_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings; r numeric;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = NEW.booking_id;
  IF b.id IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF NOT public.has_role(auth.uid(),'admin') AND b.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF b.status NOT IN ('approved','completed') THEN RAISE EXCEPTION 'Payments can only be recorded for accepted rentals'; END IF;
  SELECT commission_rate INTO r FROM public.platform_settings WHERE id = 1;
  NEW.owner_id := b.owner_id; NEW.renter_id := b.renter_id;
  NEW.commission_rate := coalesce(r, 3);
  NEW.commission_amount := round(NEW.amount * NEW.commission_rate / 100, 2);
  NEW.recorded_by := auth.uid();
  PERFORM public.notify(b.renter_id, 'Payment recorded', 'A payment of ETB ' || NEW.amount || ' was recorded for your rental.', '/renter');
  IF public.has_role(auth.uid(),'admin') THEN
    PERFORM public.log_audit('payment.record', 'payment', NEW.id::text, jsonb_build_object('amount', NEW.amount));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_guard BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.payment_guard();

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewer_name text NOT NULL DEFAULT '',
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 1000),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated
  USING (NOT hidden OR reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "renter writes review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "admin moderates review" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.review_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO b FROM public.bookings WHERE id = NEW.booking_id;
    IF b.id IS NULL OR b.renter_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
    IF b.status <> 'completed' THEN RAISE EXCEPTION 'You can review a rental once it is completed'; END IF;
    NEW.listing_id := b.listing_id;
    NEW.hidden := false;
    SELECT coalesce(nullif(full_name,''),'Renter') INTO NEW.reviewer_name FROM public.profiles WHERE id = auth.uid();
    PERFORM public.notify(b.owner_id, 'New review', NEW.rating || '★ review on your listing', '/owner');
  ELSE
    IF NEW.hidden IS DISTINCT FROM OLD.hidden THEN
      PERFORM public.log_audit(CASE WHEN NEW.hidden THEN 'review.hide' ELSE 'review.show' END, 'review', NEW.id::text, '{}'::jsonb);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER review_guard BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.review_guard();

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'listing' CHECK (kind IN ('listing','rental','dispute','support')),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 200),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reporter or admin read" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user files report" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "admin handles report" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.report_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'open'; NEW.admin_note := '';
  ELSE
    NEW.updated_at := now();
    IF NEW.status IS DISTINCT FROM OLD.status OR NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN
      PERFORM public.log_audit('report.' || NEW.status, 'report', NEW.id::text, jsonb_build_object('note', NEW.admin_note));
      PERFORM public.notify(NEW.reporter_id, 'Report ' || NEW.status, coalesce(nullif(NEW.admin_note,''), NEW.reason), '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER report_guard BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.report_guard();

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  plan text NOT NULL CHECK (plan IN ('business_basic','business_pro')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  starts_at date NOT NULL DEFAULT current_date,
  ends_at date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read subs" ON public.subscriptions FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert subs" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update subs" ON public.subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.subscription_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_audit('subscription.' || lower(TG_OP), 'subscription', NEW.id::text, jsonb_build_object('plan', NEW.plan, 'status', NEW.status, 'owner', NEW.owner_id));
  RETURN NEW;
END $$;
CREATE TRIGGER subscription_audit AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.subscription_audit();

DO $$
DECLARE d record;
BEGIN
  FOR d IN SELECT * FROM (VALUES
    ('a0000000-0000-4000-8000-000000000001'::uuid, 'admin@renta.demo',  'Admin123!',  'Demo Admin',  'renter'),
    ('a0000000-0000-4000-8000-000000000002'::uuid, 'owner@renta.demo',  'Owner123!',  'Demo Owner',  'owner'),
    ('a0000000-0000-4000-8000-000000000003'::uuid, 'renter@renta.demo', 'Renter123!', 'Demo Renter', 'renter')
  ) AS v(id, email, pw, name, role)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = d.email) THEN
      INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      VALUES ('00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email,
        extensions.crypt(d.pw, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', d.name, 'role', d.role), now(), now(),
        '', '', '', '', '', '', '', '');
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), d.id, d.id::text,
        jsonb_build_object('sub', d.id::text, 'email', d.email, 'email_verified', true),
        'email', now(), now(), now());
    END IF;
  END LOOP;
END $$;

INSERT INTO public.user_roles(user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'admin@renta.demo'
ON CONFLICT DO NOTHING;
UPDATE public.profiles SET verified = true, verification_status = 'verified' WHERE id IN (SELECT id FROM auth.users WHERE email = 'owner@renta.demo');

INSERT INTO public.listings (owner_id, kind, category, title, description, neighborhood, price, price_unit, bedrooms, bathrooms, size_sqm, furnishing, amenities, images, owner_name, owner_verified, status, make, model, year, seats, with_operator)
SELECT u.id, v.kind, v.category, v.title, v.description, v.neighborhood, v.price, v.price_unit, v.bedrooms, v.bathrooms, v.size_sqm, v.furnishing, v.amenities, v.images, 'Demo Owner', true, 'approved', v.make, v.model, v.year, v.seats, v.op
FROM auth.users u, (VALUES
  ('property','apartment','Bright 2-bedroom apartment in Bole','Modern apartment close to cafes and the airport.','Bole',35000,'month',2,2,95,'furnished','{Parking,Wi-Fi,Elevator}'::text[],'{p1,p2}'::text[],NULL,NULL,NULL::int,NULL::int,false),
  ('property','house','Family G+1 house in CMC','Spacious house with garden and secure compound.','CMC',60000,'month',4,3,220,'semi-furnished','{Parking,Garden,"Security guard"}'::text[],'{p3,hero}'::text[],NULL,NULL,NULL,NULL,false),
  ('property','room','Private room in shared flat, Sarbet','Quiet room with shared kitchen, ideal for students.','Sarbet',8000,'month',1,1,18,'furnished','{Wi-Fi,"Water tank"}'::text[],'{p2}'::text[],NULL,NULL,NULL,NULL,false),
  ('property','commercial','Ground-floor shop in Kazanchis','Street-facing shop space with storage room.','Kazanchis',45000,'month',0,1,60,'unfurnished','{Parking,"Security guard"}'::text[],'{hero}'::text[],NULL,NULL,NULL,NULL,false),
  ('property','furnished','Furnished studio near Summit','Move-in ready studio for short or long stays.','Summit',25000,'month',1,1,40,'furnished','{Wi-Fi,Generator,Balcony}'::text[],'{p1}'::text[],NULL,NULL,NULL,NULL,false),
  ('property','apartment','3-bedroom condo in Ayat','Family condo with elevator and parking.','Ayat',28000,'month',3,2,110,'unfurnished','{Parking,Elevator}'::text[],'{p3}'::text[],NULL,NULL,NULL,NULL,false),
  ('vehicle','car','Toyota Corolla — economy sedan','Fuel-efficient sedan for city driving.','Old Airport',2500,'day',0,0,NULL,NULL,'{"Air conditioning",Bluetooth}'::text[],'{v-suv}'::text[],'Toyota','Corolla',2019,5,false),
  ('vehicle','suv','Toyota Land Cruiser with driver','Comfortable 4x4 for city or countryside trips.','Kazanchis',6500,'day',0,0,NULL,NULL,'{"Driver included",GPS}'::text[],'{v-suv}'::text[],'Toyota','Land Cruiser',2020,7,true),
  ('vehicle','truck','Isuzu FSR cargo truck','Cargo truck for moving and deliveries.','Gerji',7000,'day',0,0,NULL,NULL,'{"Driver included"}'::text[],'{v-van}'::text[],'Isuzu','FSR',2017,3,true),
  ('vehicle','van','Toyota Hiace minibus','Group transfers up to 14 passengers.','Megenagna',4500,'day',0,0,NULL,NULL,'{"Air conditioning","Driver included"}'::text[],'{v-van}'::text[],'Toyota','Hiace',2018,14,true),
  ('equipment','construction','CAT 320 excavator with operator','Excavator for site works, operator included.','Piassa',18000,'day',0,0,NULL,NULL,'{"Operator included",Transport}'::text[],'{e-excavator}'::text[],'CAT','320',2016,NULL,true),
  ('equipment','power','50 kVA diesel generator','Reliable backup power for events and sites.','Gerji',4000,'day',0,0,NULL,NULL,'{Delivery}'::text[],'{e-generator}'::text[],NULL,NULL,NULL,NULL,false)
) AS v(kind, category, title, description, neighborhood, price, price_unit, bedrooms, bathrooms, size_sqm, furnishing, amenities, images, make, model, year, seats, op)
WHERE u.email = 'owner@renta.demo';
-- Strengthen RLS policies for phone verifications
DROP POLICY IF EXISTS "Users can view their own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can create their own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can update their own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can delete their own phone verifications" ON public.phone_verifications;

CREATE POLICY "Users can view their own phone verifications" ON public.phone_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own phone verifications" ON public.phone_verifications
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- Fix critical security issues

-- 1. Add INSERT policy for profiles (allows users to complete registration)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. Add INSERT policy for audit_logs (enable audit logging)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Add trigger for automatic audit logging on sensitive operations
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    changes,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Add audit triggers on critical tables
CREATE TRIGGER audit_profiles_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.is_approved IS DISTINCT FROM NEW.is_approved OR OLD.is_suspended IS DISTINCT FROM NEW.is_suspended)
EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_election_changes
AFTER INSERT OR UPDATE ON public.elections
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_event();
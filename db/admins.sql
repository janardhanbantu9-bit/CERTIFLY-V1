-- Certifly — grant the admin role to your admin accounts.
-- Run this AFTER db/setup.sql and AFTER creating the users.
--
-- Create the users first in the Supabase dashboard:
--   Authentication -> Users -> Add user -> "Create new user"
--   Email:    admin1@certifly.local  (repeat for admin2 / admin3 / admin4)
--   Password: CERTIFLY_ADMIN
--   Tick "Auto Confirm User" so they can sign in immediately.
--
-- The app signs in with the username ADMIN1..ADMIN4 and maps it internally
-- to <username lowercased>@certifly.local, so these exact emails matter.

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE u.email IN (
  'admin1@certifly.local',
  'admin2@certifly.local',
  'admin3@certifly.local',
  'admin4@certifly.local'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Check the result: should list the four accounts with role = admin.
SELECT u.email, r.role
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
ORDER BY u.email;

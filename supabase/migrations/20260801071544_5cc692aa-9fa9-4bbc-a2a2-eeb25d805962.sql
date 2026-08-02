DELETE FROM public.certificates WHERE code = 'EVT-2026-UX4L8';
DELETE FROM public.events WHERE organiser->>'eventName' = 'Sample Event';
UPDATE public.notifications
SET body = 'Ok. Got your message'
WHERE id = '5c378022-5949-42f4-b76b-a240e58ec875'
  AND kind = 'message'
  AND body = 'Re: Test';
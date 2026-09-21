CREATE POLICY "Signed-in users can read BEGIN UPSC resource files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'begin-upsc-resources');

CREATE POLICY "Admins can upload BEGIN UPSC resource files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'begin-upsc-resources' AND private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update BEGIN UPSC resource files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'begin-upsc-resources' AND private.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'begin-upsc-resources' AND private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete BEGIN UPSC resource files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'begin-upsc-resources' AND private.has_role(auth.uid(), 'admin'));

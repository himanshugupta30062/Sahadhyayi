CREATE POLICY "Users can delete their own feedback"
ON public.content_feedback FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
ON public.user_generated_content FOR DELETE
USING (auth.uid() = user_id);
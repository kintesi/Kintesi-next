-- =========================================================
-- Cart Fly: Automatic Stock Reduction Trigger (Supabase)
-- =========================================================

-- Trigger function to reduce stock automatically when order is inserted
CREATE OR REPLACE FUNCTION public.auto_reduce_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  item_product_id TEXT;
  item_quantity INTEGER;
BEGIN
  -- Loop through each item in the order's items JSON array
  FOR item_record IN SELECT * FROM jsonb_to_recordset(NEW.items) AS x("productId" TEXT, "quantity" INTEGER)
  LOOP
    item_product_id := item_record."productId";
    item_quantity := COALESCE(item_record."quantity", 1);

    -- Decrement stock in products table
    UPDATE public.products
    SET stock = GREATEST(0, stock - item_quantity),
        updated_at = timezone('utc'::text, now())
    WHERE id::text = item_product_id OR slug = item_product_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to orders table
DROP TRIGGER IF EXISTS trg_reduce_stock ON public.orders;
CREATE TRIGGER trg_reduce_stock
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.auto_reduce_stock_on_order();

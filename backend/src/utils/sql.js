// Shared SQL fragments for products. Pricing is computed at query time:
//   base_value   = ornaments.price (per gram) * products.ornament_weight + miscalleneous_price
//   final_price  = base_value * (100 - discount_percentage) / 100
//
// All numeric columns in this DB are stored as VARCHAR (legacy), hence the casts.

const PRODUCT_PRICE_SQL = `
  ROUND(
    (COALESCE(NULLIF(o.price, ''), '0') + 0)
    * (COALESCE(NULLIF(p.ornament_weight, ''), '0') + 0)
    + (COALESCE(NULLIF(p.miscalleneous_price, ''), '0') + 0),
    2
  )`

const PRODUCT_DISCOUNTED_SQL = `
  ROUND(
    (
      (COALESCE(NULLIF(o.price, ''), '0') + 0)
      * (COALESCE(NULLIF(p.ornament_weight, ''), '0') + 0)
      + (COALESCE(NULLIF(p.miscalleneous_price, ''), '0') + 0)
    ) * (100 - (COALESCE(NULLIF(p.discount_percentage, ''), '0') + 0)) / 100,
    2
  )`

const productSelect = (alias = 'p') => `
  ${alias}.id,
  ${alias}.product_code,
  ${alias}.product_name,
  ${alias}.slug,
  ${alias}.featured_image,
  ${alias}.additional_images,
  ${alias}.size_chart,
  ${alias}.short_description,
  ${alias}.description,
  ${alias}.features,
  ${alias}.general_info,
  ${alias}.hashtags,
  ${alias}.category_id,
  ${alias}.subcategory_id,
  ${alias}.ornament_type,
  ${alias}.ornament_weight,
  ${alias}.discount_percentage,
  ${alias}.is_lakshmi_kubera,
  ${alias}.is_popular_collection,
  ${alias}.is_recommended,
  ${alias}.stock,
  ${alias}.created_at,
  ${PRODUCT_PRICE_SQL} AS mrp,
  ${PRODUCT_DISCOUNTED_SQL} AS discounted_price
`

module.exports = {
  PRODUCT_PRICE_SQL,
  PRODUCT_DISCOUNTED_SQL,
  productSelect
}

import React, { useState } from 'react';
import { imageUrl, formatPrice } from '../lib/supabase';

const DIET_LABEL = { veg: 'Veg', non_veg: 'Non-Veg', beverage: 'Beverage' };

export function DietMark({ diet }) {
  return (
    <span className={`diet diet-${diet}`} title={DIET_LABEL[diet]} aria-label={DIET_LABEL[diet]}>
      <i />
    </span>
  );
}

export default function ProductCard({ product, view }) {
  const [broken, setBroken] = useState(false);
  const src = imageUrl(product.image_path);
  const soldOut = product.status === 'sold_out';

  return (
    <article className={`pcard ${view} ${soldOut ? 'is-soldout' : ''}`}>
      <div className="pcard-media">
        {src && !broken ? (
          <img src={src} alt={product.name} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="pcard-ph" aria-hidden="true">
            <img src="/logo.png" alt="" />
          </div>
        )}
        <span className={`badge ${soldOut ? 'badge-out' : 'badge-in'}`}>
          {soldOut ? 'Sold out' : 'Available'}
        </span>
      </div>
      <div className="pcard-body">
        <div className="pcard-top">
          <DietMark diet={product.diet} />
          <h3>{product.name}</h3>
        </div>
        {product.description && <p className="pcard-desc">{product.description}</p>}
        <div className="pcard-foot">
          <span className="price">{formatPrice(product.price)}</span>
          {product.is_demo && <span className="demo-tag">Sample price</span>}
        </div>
      </div>
    </article>
  );
}

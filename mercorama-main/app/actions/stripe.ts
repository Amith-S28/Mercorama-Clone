'use server'

import { stripe } from '@/lib/stripe'
import { PRODUCTS } from '@/lib/products'

export async function startCheckoutSession(productId: string) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Free tier doesn't need checkout
  if (product.priceInCents === 0) {
    throw new Error('Cannot checkout with free product')
  }

  // Enterprise requires contact sales
  if (productId === 'enterprise') {
    throw new Error('Enterprise plans require contacting sales')
  }

  // Create Checkout Sessions for subscriptions
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: product.billingInterval === 'year' ? 'year' : 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    customer_email: undefined, // Will be provided by user in checkout
  })

  return session.client_secret
}

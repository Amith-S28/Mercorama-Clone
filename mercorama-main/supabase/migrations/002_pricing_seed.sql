-- Seed pricing page blocks (v4 — conversion improvements)
-- Run this in the Supabase SQL editor.

DO $$
DECLARE
  v_page_id uuid;
BEGIN
  INSERT INTO marketing_pages (slug, title)
  VALUES ('pricing', 'Pricing Page')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_page_id FROM marketing_pages WHERE slug = 'pricing';

  DELETE FROM marketing_blocks WHERE page_id = v_page_id;

  -- 1. Hero
  INSERT INTO marketing_blocks (page_id, type, data, position) VALUES (
    v_page_id, 'hero',
    jsonb_build_object(
      'heading', 'From HS Code to Export-Ready Deal.',
      'subheading', 'Turn product descriptions into HS dossiers, Incoterms, and export-ready deal summaries—built for Canadian SMEs.',
      'primaryButtonLabel', 'Start a Deal',
      'primaryButtonHref', '/deal',
      'secondaryButtonLabel', 'Talk to us',
      'secondaryButtonHref', 'mailto:team@buildgrt.com',
      'badgeText', 'Built for Canadian exporters',
      'reassuranceItems', jsonb_build_array(
        'Avoid misclassification penalties',
        'Quote international customers with confidence',
        'Cancel anytime'
      )
    ),
    1
  );

  -- 2. Pricing plans
  INSERT INTO marketing_blocks (page_id, type, data, position) VALUES (
    v_page_id, 'pricing_plans',
    jsonb_build_object(
      'sectionTitle', 'Choose a plan that matches your export volume',
      'sectionSubtitle', 'All plans include HS classification, Incoterm guidance, and deal summary generation inside the Deal Wizard.',
      'plans', jsonb_build_array(
        jsonb_build_object(
          'name', 'Starter',
          'tagline', 'For your first export deals.',
          'price', '$99/month',
          'annualPrice', '$79/month',
          'priceNote', 'No setup fees. Cancel anytime.',
          'annualPriceNote', 'Billed as $950/year — save 20%',
          'dealsPerMonth', 'Up to 10 deals / month',
          'bestFor', 'Best for 1–2 export customers per year',
          'monthlyProductId', 'pro-monthly',
          'annualProductId', 'pro-annual',
          'features', jsonb_build_array(
            '10 complete deals per month (HS dossier + Incoterm + deal summary)',
            'Up to 30 Incoterms Analyzer runs / month',
            'Up to 30 HS Code classifications / month',
            'Up to 30 Deal Summary Generator runs / month',
            'Save Product Export Profiles for your main SKUs',
            'Email support'
          ),
          'highlight', false,
          'ctaLabel', 'Start with Starter',
          'ctaHref', '/auth/signup',
          'ribbon', null
        ),
        jsonb_build_object(
          'name', 'Growth',
          'tagline', 'For manufacturers exporting every month.',
          'price', '$249/month',
          'annualPrice', '$199/month',
          'priceNote', 'Most popular for active exporters.',
          'annualPriceNote', 'Billed as $2,390/year — save 20%',
          'dealsPerMonth', 'Up to 50 deals / month',
          'bestFor', 'Best for 1–4 export customers',
          'monthlyProductId', 'team-monthly',
          'annualProductId', 'team-annual',
          'features', jsonb_build_array(
            '50 complete deals per month (HS dossier + Incoterm + deal summary)',
            'Up to 150 Incoterms Analyzer runs / month',
            'Up to 150 HS Code classifications / month',
            'Up to 150 Deal Summary Generator runs / month',
            'FTA Diversify Wizard + Export Compass',
            'Shared Product Export Profiles across your team',
            'Priority support and onboarding call'
          ),
          'highlight', true,
          'ctaLabel', 'Choose Growth',
          'ctaHref', '/auth/signup',
          'ribbon', 'Most popular for active exporters'
        ),
        jsonb_build_object(
          'name', 'Advisory',
          'tagline', 'For brokers and consultants serving many clients.',
          'price', 'Let''s talk',
          'priceNote', 'Custom usage and terms.',
          'dealsPerMonth', 'High-volume and multi-client',
          'bestFor', 'Best for advisors packaging Mercorama into services',
          'features', jsonb_build_array(
            'Everything in Growth, with higher or unlimited deal volumes',
            'Multi-client workspaces',
            'Custom deal summary templates and white-labeled exports',
            'Dedicated success manager'
          ),
          'highlight', false,
          'ctaLabel', 'Book a call',
          'ctaHref', 'mailto:team@buildgrt.com',
          'ribbon', 'For advisors'
        )
      )
    ),
    2
  );

  -- 3. Feature list (outcome-first copy)
  INSERT INTO marketing_blocks (page_id, type, data, position) VALUES (
    v_page_id, 'feature_list',
    jsonb_build_object(
      'title', 'Why Mercorama over spreadsheets and free HS tools?',
      'subtitle', 'You don''t just need a code — you need a clean deal that stands up with customers, brokers, and auditors.',
      'items', jsonb_build_array(
        jsonb_build_object(
          'title', 'From classification to deal summary',
          'description', 'Win deals with paperwork that matches reality: start from HS codes, then carry those decisions into Incoterms and deal summaries so quotes and customs align.'
        ),
        jsonb_build_object(
          'title', 'Built for Canadian SMEs',
          'description', 'Use defaults, examples, and guidance tuned for Canadian exporters selling into the U.S., EU, and beyond — without having to become a trade lawyer.'
        ),
        jsonb_build_object(
          'title', 'Audit-ready deal history',
          'description', 'Answer "why this code?" in seconds. Each deal keeps its HS reasoning, Incoterm choice, and final deal summary together for audits and repeat orders.'
        )
      )
    ),
    3
  );

  -- 4. Who it is for (with specific plan hints)
  INSERT INTO marketing_blocks (page_id, type, data, position) VALUES (
    v_page_id, 'who_it_is_for',
    jsonb_build_object(
      'sectionTitle', 'Who Mercorama is for',
      'cards', jsonb_build_array(
        jsonb_build_object(
          'title', 'Small manufacturer shipping your first pallets',
          'description', 'You are quoting a U.S. or EU customer and want to avoid misclassification, bad Incoterms choices, and deal summaries that do not match reality. Typical shipment value: $20k–$150k.',
          'planHint', 'Starter'
        ),
        jsonb_build_object(
          'title', 'Growing exporter with repeat orders',
          'description', 'You have a handful of regular customers and want a repeatable way to classify products, price deals, and keep deal summaries organized across your team.',
          'planHint', 'Growth'
        ),
        jsonb_build_object(
          'title', 'Trade consultant or customs broker',
          'description', 'You advise multiple SMEs and want a structured way to run HS, Incoterms, and deal summaries for each client without building your own system.',
          'planHint', 'Advisory'
        )
      )
    ),
    4
  );

  -- 5. FAQ (with objection-handling additions, first item shown open)
  INSERT INTO marketing_blocks (page_id, type, data, position) VALUES (
    v_page_id, 'faq',
    jsonb_build_object(
      'sectionTitle', 'Frequently asked questions',
      'items', jsonb_build_array(
        jsonb_build_object(
          'question', 'What if I only export once or twice a year?',
          'answer', 'Starter is designed for low-frequency exporters. You can subscribe for the months you are actively quoting and shipping, then cancel or pause in between. There are no annual commitments on the monthly plan.'
        ),
        jsonb_build_object(
          'question', 'What counts as a deal?',
          'answer', 'A deal is one full run through the Deal Wizard — from product description to HS dossier, Incoterm selection, and generated deal summary. You can edit that deal as many times as you like without it counting again.'
        ),
        jsonb_build_object(
          'question', 'Can my team use one subscription?',
          'answer', 'Yes. You can invite multiple team members to work on the same deals, so sales, operations, and advisors stay in sync. Growth plans include shared Product Export Profiles across your team.'
        ),
        jsonb_build_object(
          'question', 'How do the Incoterms Analyzer, HS Code, and Deal Summary Generator limits work?',
          'answer', 'Each plan includes extra runs of the standalone tools for quick questions outside the wizard. Starter includes up to 30 runs each per month; Growth includes up to 150.'
        ),
        jsonb_build_object(
          'question', 'What happens if I go over my included deals or tool runs?',
          'answer', 'We will not cut you off mid-month. If you consistently go over your plan limits, we will reach out and either add a simple per-deal overage or recommend a better-fitting plan.'
        ),
        jsonb_build_object(
          'question', 'What is the difference between monthly and annual billing?',
          'answer', 'Annual plans are billed as a single upfront charge and save you 20%. Starter annual is $950/year ($79/month effective). Growth annual is $2,390/year ($199/month effective). You can cancel at any time and retain access until the end of your billing period.'
        ),
        jsonb_build_object(
          'question', 'How secure is my data?',
          'answer', 'Your data is encrypted in transit and at rest. Only your team can see your deals, and you can export your data at any time. Mercorama is hosted on infrastructure that meets enterprise security standards.'
        ),
        jsonb_build_object(
          'question', 'Can my broker or lawyer still review things?',
          'answer', 'Yes. Mercorama is designed to give brokers and lawyers better inputs, not replace them. You can share the HS dossier and deal summary so they can review and adjust before you sign.'
        ),
        jsonb_build_object(
          'question', 'Is Mercorama a replacement for customs brokers or legal advice?',
          'answer', 'No. Mercorama helps you prepare HS, Incoterms, and deal summary drafts based on your inputs, but final decisions and filings should always be confirmed with qualified customs and legal professionals.'
        )
      )
    ),
    5
  );

  -- 6. CTA
  INSERT INTO marketing_blocks (page_id, type, data, position) VALUES (
    v_page_id, 'cta',
    jsonb_build_object(
      'heading', 'Ready to ship your next deal with confidence?',
      'body', 'Start a live deal in Mercorama and see how HS classification, Incoterms, and deal summaries come together in one simple flow.',
      'buttonLabel', 'Start a Deal',
      'buttonHref', '/deal'
    ),
    6
  );

END $$;

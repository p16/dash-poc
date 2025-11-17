/**
 * Uswitch Mobile Deals Collector (GraphQL API)
 *
 * Collects SIM-only deal data from Uswitch's GraphQL API.
 * Uses pagination to fetch all available deals.
 *
 * Story: 2.3 - Uswitch API Integration
 */

import { insertPlans } from '../../db/plans';
import { logger } from '../../utils/logger';
import type { PlanData } from '../../../types/database';

interface UswitchDeal {
  __typename: string;
  id: string;
  version: number;
  seasonalType?: string;
  position?: {
    position: number;
    profileName: string;
  };
  isESimCompatible?: boolean;
  isExclusive?: boolean;
  isUswitchPlus?: boolean;
  uswitchPlusOffer?: string;
  network: {
    name: string;
    key: string;
    mobileNetworkOperator: string;
    images: {
      logo: string;
    };
  };
  retailer: {
    key: string;
    name: string;
  };
  plan: {
    is5G: boolean;
    minutes: string;
    data: string;
    roamingDestinations?: string[];
    roamingAllowance?: string;
  };
  costs: {
    contractLength: number;
    upfront: number;
    total: number;
    deductions: number;
    monthly: {
      total: number;
      startOfTermDiscount?: Array<{
        discountMonth: number;
        discountedPrice: number;
      }>;
    };
    priceRises?: Array<{
      changeAmount: number;
      startDate: string;
    }>;
  };
  priceRise?: string;
  offers?: Array<{
    offerType: string;
    characteristics: {
      title: string;
    };
  }>;
}

interface UswitchResponse {
  data: {
    dealsSimOnlyAndAds: {
      metadata: {
        total: number;
      };
      items: UswitchDeal[];
    };
  };
}

const GRAPHQL_QUERY = `
  fragment FilterOptionGroup on FilterOptionGroup {
    __typename
    key
    label
    isMutuallyExclusive
    options {
      key
      label
      isSelected
      isAvailable
      total
      image
    }
  }

  fragment NestedFilterOptionGroup on NestedFilterOptionGroup {
    __typename
    key
    label
    options {
      key
      label
      selectionState
      isAvailable
      children {
        key
        label
        isSelected
        isAvailable
        total
        image
      }
    }
  }

  fragment SimOnlyPageDeal on DealSimOnly {
    __typename
    id
    version
    seasonalType
    position {
      position
      profileName
    }
    isESimCompatible
    isExclusive
    isUswitchPlus
    uswitchPlusOffer
    seasonalType
    network {
      name
      key
      mobileNetworkOperator
      images {
        logo
      }
    }
    retailer {
      key
      name
    }
    plan {
      is5G
      minutes
      data
      roamingDestinations
      roamingAllowance
    }
    costs {
      contractLength
      upfront
      total
      deductions
      monthly {
        total
        startOfTermDiscount {
          discountMonth
          discountedPrice
        }
      }
      ...PriceRises
      ...CostSchedule
    }
    priceRise
    offers(filterSelection: { excludeByType: ["discount", "black-friday", "cyber-monday", "exclusive-tariff"] }) {
      offerType
      characteristics {
        title
      }
    }
  }

  fragment SimOnlyPageDeals on Query {
    dealsSimOnlyAndAds {
      metadata(
        input: {
          limit: $limit
          positioningProfile: $positioningProfile
          sortBy: $sortBy
          filterSelection: $filterSelection
        }
      ) {
        total
      }
      items(
        dealInput: {
          limit: $limit
          offset: $offset
          positioningProfile: $positioningProfile
          sortBy: $sortBy
          filterSelection: $filterSelection
        }
        adsInput: { slug: $adsSlug, positions: [4] }
      ) {
        ... on DealSimOnly {
          ...SimOnlyPageDeal
        }
        ... on Ad {
          ...SimOnlyPageAd
        }
      }
      filterOptions {
        dataRange(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
        networkProviders(filterSelection: $filterSelection) {
          ...NestedFilterOptionGroup
        }
        monthlyCostRange(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
        is5G(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
        isESimCompatible(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
        isBlackFriday(filterSelection: $filterSelection) @include(if: $isBlackFriday) {
          ...FilterOptionGroup
        }
        contractMonths(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
        isUnlimitedMinutes(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
        isUnlimitedTexts(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
        roamingDestinations(filterSelection: $filterSelection) {
          ...FilterOptionGroup
        }
      }
    }
  }

  fragment P0P4Base on Ad {
    __typename
    position {
      position
      profileName
    }
    display {
      productId
      title
      imageUrl
      backgroundColor
      usp
      adType
      awardTitle
    }
  }

  fragment P0P4DealBase on BaseDeal {
    __typename
    id
    version
    links {
      clickout
    }
    costs {
      contractLength
      ...PriceRises
      ...CostSchedule
      monthly {
        total
      }
      upfront
      total
      deductions
    }
    plan {
      data
      is5G
      roamingAllowance
      roamingDestinations
    }
    retailer {
      key
      name
    }
    network {
      name
      key
      mobileNetworkOperator
      images {
        logo
      }
    }
    isExclusive
    priceRise
    usps: offers(filterSelection: { excludeByType: ["discount", "black-friday", "cyber-monday", "exclusive-tariff"] }) {
      characteristics {
        title
      }
      offerType
    }
  }

  fragment SimOnlyPageAd on Ad {
    ...P0P4Base
    deal {
      ...P0P4DealBase
      ... on DealSimOnly {
        isESimCompatible
        isUswitchPlus
        uswitchPlusOffer
        seasonalType
        priceRise
        costs {
          ...PriceRises
          ...CostSchedule
          contractLength
          monthly {
            total
            startOfTermDiscount {
              discountMonth
              discountedPrice
            }
          }
          upfront
          total
        }
      }
    }
  }

  fragment CostSchedule on Costs {
    schedule {
      startDate
      endDate
      monthlyCost
      changeAmount
      changeType
      inContract
    }
  }

  fragment CostPhase on CostPhase {
    changeAmount
    startDate
  }

  fragment PriceRises on Costs {
    priceRises: schedule(filterSelection: { includeByType: ["price-rise"] }) {
      ...CostPhase
    }
  }

  query SimOnlyPageDeals(
    $adsSlug: String!
    $limit: Int!
    $offset: Int
    $positioningProfile: String
    $sortBy: DEAL_SORT_BY!
    $filterSelection: DealFilterSelection!
    $isBlackFriday: Boolean!
  ) {
    ...SimOnlyPageDeals
  }
`;

/**
 * Fetch deals from Uswitch GraphQL API
 */
async function fetchUswitchDeals(
  limit: number = 100,
  offset: number = 0
): Promise<UswitchResponse> {
  const url = 'https://www.uswitch.com/mobiles/graphql';

  const headers = {
    accept: '*/*',
    'accept-language': 'en-GB,en;q=0.5',
    'content-type': 'application/json',
    origin: 'https://www.uswitch.com',
    referer: 'https://www.uswitch.com/mobiles/compare/sim_only_deals/',
    'sec-ch-ua':
      '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sec-gpc': '1',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'x-usw-csrf': '1',
  };

  const variables = {
    offset,
    limit,
    sortBy: 'PROMOTED',
    positioningProfile: 'simonly',
    adsSlug: 'mobiles/compare/sim-only-deals',
    filterSelection: {},
    isBlackFriday: true,
  };

  const body = {
    query: GRAPHQL_QUERY,
    variables,
  };

  try {
    logger.debug(
      { limit, offset },
      'Fetching Uswitch deals from GraphQL API'
    );

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as UswitchResponse;

    const itemCount = data?.data?.dealsSimOnlyAndAds?.items?.length || 0;
    const totalAvailable =
      data?.data?.dealsSimOnlyAndAds?.metadata?.total || 0;

    logger.debug(
      { itemCount, totalAvailable, offset },
      'Received Uswitch API response'
    );

    return data;
  } catch (error) {
    logger.error({ error, limit, offset }, 'Failed to fetch Uswitch deals');
    throw error;
  }
}

/**
 * Fetch all deals with pagination
 */
async function fetchAllUswitchDeals(): Promise<UswitchDeal[]> {
  const allDeals: UswitchDeal[] = [];
  let offset = 0;
  const batchSize = 100;

  while (true) {
    const response = await fetchUswitchDeals(batchSize, offset);
    const deals = response?.data?.dealsSimOnlyAndAds?.items || [];

    // Filter out ads, keep only DealSimOnly items
    const simOnlyDeals = deals.filter(
      (deal) => deal.__typename === 'DealSimOnly'
    );

    logger.debug(
      { total: deals.length, simOnly: simOnlyDeals.length, offset },
      'Filtered deals batch'
    );

    if (simOnlyDeals.length === 0) {
      logger.debug('No more SIM-only deals, stopping pagination');
      break;
    }

    allDeals.push(...simOnlyDeals);
    offset += deals.length;

    // Small delay between requests to be respectful
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Safety limit
    if (offset >= 1000) {
      logger.warn('Reached safety limit of 1000 deals');
      break;
    }
  }

  logger.info({ totalDeals: allDeals.length }, 'Completed pagination');
  return allDeals;
}

/**
 * Transform Uswitch deal to PlanData format
 */
function transformUswitchDeal(deal: UswitchDeal): PlanData {
  // Build plan name from network + data
  const planName = `${deal.network.name} - ${deal.plan.data}`;

  // Format price
  const monthlyPrice = deal.costs.monthly.total;
  const upfrontCost = deal.costs.upfront;
  const priceText =
    upfrontCost > 0
      ? `£${monthlyPrice}/month + £${upfrontCost} upfront`
      : `£${monthlyPrice}/month`;

  // Contract term
  const contractTerm = `${deal.costs.contractLength} months`;

  // Extract extras/offers
  const extras: string[] = [];
  if (deal.plan.is5G) extras.push('5G enabled');
  if (deal.isESimCompatible) extras.push('eSIM compatible');
  if (deal.isUswitchPlus) extras.push(`Uswitch Plus: ${deal.uswitchPlusOffer || 'Available'}`);
  if (deal.plan.roamingDestinations?.length) {
    extras.push(`Roaming: ${deal.plan.roamingDestinations.join(', ')}`);
  }
  if (deal.offers) {
    deal.offers.forEach((offer) => {
      extras.push(offer.characteristics.title);
    });
  }

  // Destructure to avoid duplicate fields in spread
  const { network, retailer, plan, costs, offers: _offers, ...otherFields } = deal;

  return {
    name: planName,
    price: priceText,
    data_allowance: plan.data,
    contract_term: contractTerm,
    extras,
    // Preserve all Uswitch-specific fields
    deal_id: deal.id,
    network_name: network.name,
    network_key: network.key,
    network_operator: network.mobileNetworkOperator,
    retailer_name: retailer.name,
    retailer_key: retailer.key,
    is_5g: plan.is5G,
    minutes: plan.minutes,
    roaming_destinations: plan.roamingDestinations,
    roaming_allowance: plan.roamingAllowance,
    upfront_cost: costs.upfront,
    total_cost: costs.total,
    monthly_cost: costs.monthly.total,
    contract_length: costs.contractLength,
    is_exclusive: deal.isExclusive,
    is_esim_compatible: deal.isESimCompatible,
    price_rise: deal.priceRise,
    seasonal_type: deal.seasonalType,
    ...otherFields, // Preserve remaining API fields
  };
}

/**
 * Scrape and store Uswitch deals using GraphQL API
 *
 * @returns Number of plans inserted into database
 */
export async function scrapeAndStoreUswitchPlans(): Promise<number> {
  logger.info('Starting Uswitch deal collection (GraphQL API)');

  try {
    // Fetch all deals with pagination
    const deals = await fetchAllUswitchDeals();

    if (deals.length === 0) {
      logger.warn('No deals found in Uswitch API response');
      return 0;
    }

    logger.debug({ dealCount: deals.length }, 'Fetched Uswitch deals');

    // Transform to PlanData format
    const plans = deals.map(transformUswitchDeal);

    logger.debug({ planCount: plans.length }, 'Transformed Uswitch deals');

    // Insert into database
    await insertPlans('Uswitch', plans);

    logger.info(
      { planCount: plans.length },
      'Successfully scraped and stored Uswitch deals'
    );

    return plans.length;
  } catch (error) {
    logger.error({ error }, 'Failed to scrape Uswitch deals');
    throw error;
  }
}

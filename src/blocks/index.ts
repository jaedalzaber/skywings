import type { Block } from 'payload'

import { BenefitsBlock } from './BenefitsBlock'
import { CaseStudyBlock } from './CaseStudyBlock'
import { BlogListingBlock } from './BlogListingBlock'
import { BrochureListingBlock } from './BrochureListingBlock'
import { CapabilityListingBlock } from './CapabilityListingBlock'
import { ContactRFQBlock } from './ContactRFQBlock'
import { CTABlock } from './CTABlock'
import { FAQBlock } from './FAQBlock'
import { FeatureGridBlock } from './FeatureGridBlock'
import { HeroBlock } from './HeroBlock'
import { HomeEngineeringBlock } from './HomeEngineeringBlock'
import { HomeHeroBlock } from './HomeHeroBlock'
import { HomeIndustriesBlock } from './HomeIndustriesBlock'
import { HomeLocationsBlock } from './HomeLocationsBlock'
import { HomeMachiningBlock } from './HomeMachiningBlock'
import { HomeProcessBlock } from './HomeProcessBlock'
import { HomeServicesBlock } from './HomeServicesBlock'
import { LeadFormBlock } from './LeadFormBlock'
import { LogoCloudBlock } from './LogoCloudBlock'
import { IndustryListingBlock } from './IndustryListingBlock'
import { PageHeroBlock } from './PageHeroBlock'
import { ProcessStepsBlock } from './ProcessStepsBlock'
import { ProductListingBlock } from './ProductListingBlock'
import { RichTextBlock } from './RichTextBlock'
import { StatsBlock } from './StatsBlock'
import { ThreeDShowcaseBlock } from './ThreeDShowcaseBlock'

export const pageBuilderBlocks: Block[] = [
  HomeHeroBlock,
  HomeServicesBlock,
  HomeIndustriesBlock,
  // Listed in the order they render on the landing page.
  HomeMachiningBlock,
  HomeEngineeringBlock,
  HomeProcessBlock,
  HomeLocationsBlock,
  PageHeroBlock,
  CapabilityListingBlock,
  IndustryListingBlock,
  ProductListingBlock,
  BrochureListingBlock,
  BlogListingBlock,
  ContactRFQBlock,
  HeroBlock,
  LogoCloudBlock,
  BenefitsBlock,
  FeatureGridBlock,
  ThreeDShowcaseBlock,
  StatsBlock,
  ProcessStepsBlock,
  CaseStudyBlock,
  CTABlock,
  FAQBlock,
  LeadFormBlock,
  RichTextBlock,
]

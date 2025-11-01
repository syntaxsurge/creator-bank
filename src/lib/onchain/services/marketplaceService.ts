import type { Address } from 'viem'

import { membershipMarketplaceAbi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

export type MarketplaceListing = {
  seller: Address
  price: bigint
  listedAt: bigint
  expiresAt: bigint
  active: boolean
}

type ListingTuple = [Address, bigint, bigint, bigint, boolean]

export class MarketplaceService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async purchasePrimary(courseId: bigint, maxPrice: bigint) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'purchasePrimary',
      args: [courseId, maxPrice]
    })
  }

  async createListing(
    courseId: bigint,
    price: bigint,
    durationSeconds: bigint
  ) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'createListing',
      args: [courseId, price, durationSeconds]
    })
  }

  async cancelListing(courseId: bigint) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'cancelListing',
      args: [courseId]
    })
  }

  async buyListing(courseId: bigint, seller: Address, maxPrice: bigint) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'buyListing',
      args: [courseId, seller, maxPrice]
      // ERC-20 settlement handles transfers; no native value required.
    })
  }

  async renew(courseId: bigint, maxPrice: bigint) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'renew',
      args: [courseId, maxPrice]
    })
  }

  async getListing(courseId: bigint, seller: Address) {
    const listing = (await this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'getListing',
      args: [courseId, seller]
    })) as unknown as ListingTuple

    return this.mapListing(listing)
  }

  async getActiveListings(courseId: bigint) {
    const listings = (await this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'getActiveListings',
      args: [courseId]
    })) as unknown as ListingTuple[]

    return listings.map(listing => this.mapListing(listing))
  }

  async platformFeeBps() {
    return this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'platformFeeBps'
    }) as Promise<bigint>
  }

  async treasury() {
    return this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'treasury'
    }) as Promise<Address>
  }

  async maxListingDuration() {
    return this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'maxListingDuration'
    }) as Promise<bigint>
  }

  private mapListing([
    seller,
    price,
    listedAt,
    expiresAt,
    active
  ]: ListingTuple) {
    return {
      seller,
      price,
      listedAt,
      expiresAt,
      active
    } as MarketplaceListing
  }
}

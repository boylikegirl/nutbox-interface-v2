import { ethers } from 'ethers'
import { getEthWeb } from './web3'
import store from '@/store'

/**
 * Get metamask provider
 * @returns 
 */
export const getProvider = async () => {
    if (store.state.web3.ethers) {
        return store.state.web3.ethers
    }
    const metamask = await getEthWeb()
    const provider = new ethers.providers.Web3Provider(metamask)
    store.commit('web3/saveEthers', provider)
    return provider 
}
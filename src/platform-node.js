import {Agent, fetch as undiciFetch} from 'undici'

const agents = new Map()

export const agentFor = connectTimeout => {
  if (!agents.has(connectTimeout))
    agents.set(
      connectTimeout,
      new Agent({connect: {timeout: connectTimeout}})
    )
  return agents.get(connectTimeout)
}

export const platformFetch = (url, options = {}) => {
  if (options.connectTimeout) {
    options.dispatcher = options.dispatcher ?? agentFor(options.connectTimeout)
    delete options.connectTimeout
  }
  return undiciFetch(url, options)
}

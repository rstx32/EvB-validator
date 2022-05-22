import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config({ path: 'backend/config/.env' })

const getVoters = async (query) => {
  // if query is empty, then add default query
  if (Object.keys(query).length === 0) {
    query = {
      limit: 5,
      page: 1,
    }
  }

  let voters = {}

  if (query.fullname === undefined) {
    voters = await fetch(
      `http://${process.env.API_URL}/export/voter?page=${query.page}&limit=${query.limit}`
    )
  } else {
    voters = await fetch(
      `http://${process.env.API_URL}/export/voter?fullname=${query.fullname}`
    )
  }

  return await voters.json()
}

const getCandidates = async () => {
  const candidates = await fetch(`http://${process.env.API_URL}/export/candidate`)
  return await candidates.json()
}

export { getVoters, getCandidates }

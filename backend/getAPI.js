import fetch from "node-fetch"
import dotenv from 'dotenv'
dotenv.config({path: 'backend/config/.env'})

const getVoters = async (query) => {
    const voters = await fetch(`http://${process.env.API_URL}/allvoters?page=${query.page}&limit=${query.limit}`)
    return await voters.json()
}

const getCandidates = async () => {
    const candidates = await fetch(`http://${process.env.API_URL}/allcandidates`)
    return await candidates.json()
}

export {getVoters, getCandidates}
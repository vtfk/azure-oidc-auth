const axios = require('axios')
const url = 'https://graph.microsoft.com/v1.0/me'
const properties = 'onPremisesSamAccountName'

module.exports = async token => {
  const options = {
    url,
    method: 'GET',
    headers: {
      Authorization: token
    },
    params: {
      $select: properties
    }
  }

  const { data } = await axios(options)
  return data
}

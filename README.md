[![Build Status](https://travis-ci.org/vtfk/azure-oidc-auth.svg?branch=master)](https://travis-ci.org/vtfk/azure-oidc-auth)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

# azure-oidc-auth

Azure OIDC authentication 

## config docker.env

```bash
TENANT_NAME=yourtenant
CLIENT_ID=azureClientid
CLIENT_SECRET=azureSecret
REDIRECT_URL=http://localhost:3000/callback
JWT_SECRET=Louie Louie, oh no, I got to go Louie Louie, oh no, I got to go
JWT_ENCRYPT_SECRET=Louie Louie, oh no, I got to go Louie Louie, oh no, I got to go
COOKIE_SECRET=Louie Louie, oh no, I got to go Louie Louie, oh no, I got to go
```

Optional

```
POST_LOGOUT_REDIRECT_URL=<url to redirect to after logout>
```

## API

### GET ```/login?origin=<url for redirect>```

- sends the user to azure login
- successful login redirects to ```origin?jwt=<jwt>```
- jwt:
```js
{
  userName: 'Ola Nordmann',
  userId: 'samaccountname',
  email: 'ola.nordmann@vtfk.no'
}
```


### GET ```/logout```

- clears users session locally and in Azure
- redirects to vtfk.no or specified URL

### POST ```/callback```

- successful auth redirects to ```origin?jwt=<jwt>```


## License

[MIT](LICENSE)
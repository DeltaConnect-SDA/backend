# DELTA CONNECT API SPEC

## User Registration

User registration api endpoint for mobile app client.

### Endpoint

`POST /auth/register`

### Request

- body

```json
    {
        firstName: string,
        lastName: string,
        email: string,
        phone: string,
        password: string
    }
```

### Response

#### success

- body
  ```json
    status: 'success',
    code: '201',
    message: 'User registration success.'
    data: [
        token: string,
        user : {
            id: string,
            firstName: string,
            lastName: string,
            email: string,
            phone: string,
        }
    ]
  ```

#### Error

- body

```json
{
  "status": "error",
  "code": 400,
  "error": "Input validation error",
  "message": {
    "field": "firstName",
    "error": [
      "Nama depan harus diisi!",
      "Nama depan minimal 3 karakter",
      "Nama depan maksimal 20 karakter"
    ]
  }
}
```

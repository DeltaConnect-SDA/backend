# DELTA CONNECT API SPEC

## User Registration Screen

User registration api endpoint for mobile app client.

### Endpoint

`POST /auth/register`

### Request

- body

```json
    {
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "password": "string"
    }
```

### Response
API response
#### success

- body
  ```json
    success: true,
    code: 201,
    message: "Pendaftaran pengguna berhasil!"
    data: [
        {
          "user" : {
            "id": "string",
            "firstName": "string",
            "lastName": "string",
            "email": "string",
            "phone": "string",
          }
        },
        {
          "token": "string"
        }
    ]
  ```

#### Error

- body

```json
{
  "success": false,
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

## User Phone Verification Request Screen

User phone verification request api endpoint for mobile app client.

### Endpoint

`POST /auth/verify/phone/request`

### Request

- body
```json
  {
    "id": "string",
    "phone": "number"
  }
```

### Response
API response
#### success

- body
  ```json
    success: true,
    code: 201,
    message: "Pendaftaran pengguna berhasil!"
    data: [
        {
          "user" : {
            "id": "string",
            "firstName": "string",
            "lastName": "string",
            "email": "string",
            "phone": "string",
          }
        },
        {
          "token": "string"
        }
    ]
  ```

#### Error

- body

```json
{
  "success": false,
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
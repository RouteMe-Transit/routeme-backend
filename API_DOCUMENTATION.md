# RouteMe Backend API Documentation

## Overview
- Base URL: `http://localhost:3000/api/v1`
- Content type: `application/json`
- Auth type: Bearer token (JWT)

Access rules:
- Public: no token required
- Authenticated: valid token required
- Admin: valid token and `role = admin`

## 1. Authentication


### 1.1 POST /auth/login
Description: Authenticates a user with email and password, then returns a JWT and user profile. (for passengers,bus,admin)
Access: Public

Body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "phone": 071 0923234
      "role": "admin",
      "isActive": true
    }
  }
}
```

### 1.2 POST /auth/register
Description: Creates a new user account and returns a JWT for immediate authenticated access. (Only for passenger self-registration)
Access: Public

Body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": 2,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "passenger",
      "isActive": true
    }
  }
}
```

### 1.3 GET /auth/me
Description: Returns the currently authenticated user's profile based on the provided JWT.
Access: Authenticated

Response `200`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## 2.User Endpoints
Access: Admin only (all routes require token + admin role)

### 2.1 GET /users
Description: Returns alist of users.

Response `200`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "users": [
      {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "johndoe@example.com",
        "role": "admin",
        "isActive": true
      },
      {
        "id:" 2,
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "janedoe@gmail.com",
        "role": "admin",
        "isActive": true

      }
    ]
  }
}
```

### 2.2 GET /users/:id
Description: Returns details for a single user by ID.
Response `200`:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "Johndoe@example.com",
        "role": "admin",
        "isActive": true
      }
}
```

### 2.3 POST /users
Description: Creates a new user record (Only for bus and admin creation).
Body:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "bus"
}
```

Response `201`: 

```json
{
    
  "success": true,
  "message": "User created successfully",
  "data": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "role": "bus"
  }

}
```

### 2.4 PUT /users/:id
Description: Updates an existing user's information by ID.

Body:

```json
{
  "email": "bus@email.com"
}
```

Response `200`: 

```json
{
    
  "success": true,
  "message": "User updated successfully",
  "data": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "bus@email.com"
    "role": "bus"
  }

}
```
### 2.5 DELETE /users/:id
Description: Deactivates a user account without permanently deleting the database record. (isActive = false)

Response `200`:

```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": null
}
```

---

## 3. Route Endpoints
Access: Admin only

### 3.1 GET /routes
Description: Returns a list of routes.

Response `200`: 
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "routes": [
      {
        "id": 1,
        "routeNumber": "100",
        "routeName": "Panadura - Pettah",
        "origin": "Panadura",
        "destination": "Pettah",
        "routeType": "Normal",
        "distance": 115.5,
        "duration": 180,
        "isActive": true
      },
      {
        "id": 2,
        "routeNumber": "138",
        "routeName": "Nugegoda - Homagama",
        "origin": "Nugegoda",
        "destination": "Homagama",
        "routeType": "Normal",
        "distance": 40.0,
        "duration": 60,
        "isActive": true
      },
    ]
  }
}
```

### 3.2 GET /routes/:id
Description: Returns a single route by ID

Response `200`:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "id": 1,
        "routeNumber": "102",
        "routeName": "Moratuwa - Pettah",
        "routeType": "Express",
        "origin": "Moratuwa",
        "destination": "Pettah",
        "distance": 15,
        "duration": 45,
        "buses": [
            { "id": 5, 
            "busNumber": "NB-001", 
            "licensePlate": "WP-NA-1234", 
            "status": "Active" 
            },
            { "id": 6, 
            "busNumber": "NB-002", 
            "licensePlate": "WP-NA-5678", 
            "status": "Active" 
            }
        ],
        "stops": [
      {
        "stopId": 1,
        "stopSequence": 1,
        "timeFromStart": 0
      },
      {
        "stopId": 5,
        "stopSequence": 2,
        "timeFromStart": 20
      },
      {
        "stopId": 2,
        "stopSequence": 3,
        "timeFromStart": 45
      }
    ],
        "isActive": true,
    }
}
```

### 3.3 POST /routes
Description: Creates a new route.
Body:

```json
{
  "routeNumber": "101",
  "routeName": "Moratuwa - Pettah",
  "routeType": "Normal",
  "origin": "Moratuwa",
  "destination": "Pettah",
  "distance": 15,
  "duration": 45,
  "stops": [
    {
      "stopId": 1,
      "stopSequence": 1,
      "timeFromStart": 0
    },
    {
      "stopId": 5,
      "stopSequence": 2,
      "timeFromStart": 20
    },
    {
      "stopId": 2,
      "stopSequence": 3,
      "timeFromStart": 45
    }
  ]
}
```

Response `201`: 
```json
{
  "success": true,
  "message": "Route created successfully",
  "data": {
    "id": 4,
    "routeNumber": "101",
    "routeName": "Moratuwa - Pettah",
    "routeType": "Normal",
    "origin": "Moratuwa",
    "destination": "Pettah",
    "distance": 15,
    "duration": 45,
    "stops": [
    {
      "stopId": 001,
      "stopName": "Rathmalana",
      "stopSequence": 1,
      "timeFromStart": 0
    },
    {
      "stopId": 005,
      "stopSequence": 2,
      "stopName": "Dehiwala",
      "timeFromStart": 20
    },
    {
      "stopId": 002,
      "stopSequence": 3,
      "stopName": "Pettah",
      "timeFromStart": 45
    }
    ],
    "isActive": true
  }
}
```

### 3.4 PUT /routes/:id
Description: Updates an existing route by ID.

body:

```json
{
  "routeName": "Inter City Express",
}
```

Response `200`: 

```json
{
  "success": true,
  "message": "Route updated successfully",
  "data": {
    "id": 1,
    "routeNumber": "100",
    "routeName": "Panadura - Pettah",
    "routeType": "Express",
    "origin": "Panadura",
    "destination": "Pettah",
    "distance": 25,
    "duration": 45,
    "isActive": true
  }
}
```

### 3.5 DELETE /routes/:id
Description: Deactivates a route if no buses are assigned.

Response `200`:

```json
{
  "success": true,
  "message": "Route deactivated successfully",
  "data": null
}
```
Response `400`:
```json
{
  "success": false,
  "message": "Cannot delete route with assigned buses",
  "data": null
}
```

---

## 4. Stop Endpoints


### 4.1 POST /stops
Description: Create a stop
Access: Admin
Body:
```json
{
  "name": "Colombo Fort",
  "latitude": 6.9344,
  "longitude": 79.8428
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Stop created successfully",
  "data": {
    "id": 1,
    "name": "Colombo Fort",
    "latitude": 6.9344,
    "longitude": 79.8428
  }
}
```

### 4.2 Get All Stops
Description: Get a list of stops.
Access:Public
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Colombo Fort",
      "latitude": 6.9344,
      "longitude": 79.8428
    },
    {
      "id": 2,
      "name": "Kandy",
      "latitude": 7.2906,
      "longitude": 80.6337
    }
  ]
}
```
### 4.3 PATCH /stops/:id
Description: Update a stop
Access: Admin
Body:
```json
{
  "name": "Colombo Fort Main Stop"
}
```
Response `200`:
```json
{
  "success": true,
  "message": "Stop updated successfully",
  "data": {
    "id": 1,
    "name": "Colombo Fort Main Stop",
    "latitude": 6.9344,
    "longitude": 79.8428
  }
}
```

### 4.4 DELETE /stops/:id
Description: Soft delete a stop
Access: Admin
Response `200`:
```json
{
  "success": true,
  "message": "Stop deleted successfully"
}
```

## 5. Bus Endpoints
Access: Admin

### 5.1 GET /buses
Description: Returns a list of buses.

Response `200`: 

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "buses": [
      {
        "id": 1,
        "busNumber": "NB-001",
        "licensePlate": "WP-NA-1234",
        "busType": "A/C Express",
        "brand" : "Tata Motors",
        "model": "Ultra City",
        "year": 2022,
        "seatingCapacity": 54,
        "standingCapacity": 20,
        "fuelType": "Diesal",
        "assignRoute": 100,
        "shift": "Morning 5AM",
        "depot": "Colombo",
        "serviceDays":[
            "Mon",
            "Tue",
            "Wed"
        ]
        "status": "Active",
        "isActive": true,
        "route": {
            "id": 1,
            "routeNumber": "100",
            "routeName": "Colombo - Kandy",
            "origin": "Colombo",
            "destination": "Kandy"
        },
        "driver": [
            {
            "name": "KM Perera"
            },
            {
            "name": "SM Perera"
            }
        ]
      }
    ]
  }
}
```
### 5.2 GET /buses/:id
Description: Returns details for a single bus by ID.
Response `200`: 

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "busNumber": "NB-001",
    "licensePlate": "WP-NA-1234",
    "busType": "A/C Express",
    "seatingCapacity": 54,
    "standingCapacity": 10,
    "fuelType": "Diesel",
    "shift": "Morning 5AM",
    "depot": "Colombo",
    "status": "Active",
    "serviceDays": ["Mon", "Tue", "Wed"],
    "year": 2023,
    "isActive": true,
    "route": {
      "id": 1,
      "routeNumber": "100",
      "routeName": "Colombo - Kandy",
      "origin": "Colombo",
      "destination": "Kandy"
    },
    "driver": {
      "name": "KM Perera"
    }
  }
}

```

### 5.3 POST /buses
Description: Creates a new bus account.
Body:

```json
{
  "busNumber": "NB-001",
  "licensePlate": "WP-NA-1234",
  "busType": "A/C Express",
  "seatingCapacity": 54,
  "standingCapacity": 10,
  "fuelType": "Diesel",
  "assignRoute": 1,
  "assignDriver": [
    {
        "name": "KM Perera",
    },
    {
        "name": "SM Perera"
    }
  ],
  "shift": "Morning 5AM",
  "depot": "Colombo",
  "status": "Active",
  "serviceDays": ["Mon", "Tue", "Wed"],
  "year": 2023
}
```
Response `201`: 
```json
{
  "success": true,
  "message": "Bus created successfully",
  "data": {
    "id": 3,
    "busNumber": "NB-001",
    "licensePlate": "WP-NA-1234",
    "busType": "A/C Express",
    "seatingCapacity": 54,
    "standingCapacity": 10,
    "fuelType": "Diesel",
    "assignRoute": 1,
    "assignDriver": [
        {
            "name": "KM Perera",
        },
        {
            "name": "SM Perera"
        }
    ],
    "shift": "Morning 5AM",
    "depot": "Colombo",
    "status": "Active",
    "serviceDays": ["Mon", "Tue", "Wed"],
    "year": 2023,
    "isActive": true
  }
}

```

### 5.4 PUT /buses/:id
Description: Updates an existing bus record by ID.
Body:
```json
{
  "status": "Under Maintenance"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Bus updated successfully",
  "data": {
    "id": 1,
    "busNumber": "NB-001",
    "licensePlate": "WP-NA-1234",
    "busType": "A/C Express",
    "seatingCapacity": 54,
    "status": "Under Maintenance",
    "isActive": true
  }
}
```

### 5.5 DELETE /buses/:id
Description: Deactivates a bus and marks its operational status as inactive. (`isActive = false`, `status = Inactive`)

Response `200`:

```json
{
  "success": true,
  "message": "Bus deactivated successfully",
  "data": null
}
```



---

## 6. News Endpoints

### 6.1 GET /news
Description: Returns a list of news items.(Only summary data)
Access: Public

Response `200`: 
```json
    {
  "success": true,
  "message": "Success",
  "data": {
    "news": [
      {
        "id": 1,
        "title": "Service Update",
        "category": "Operations",
        "image": "https://example.com/image1.jpg",
        "publishedDate": "2026-04-01"
      },
      {
        "id": 2,
        "title": "New Bus Routes Added",
        "category": "Announcements",
        "image": "https://example.com/image2.jpg",
        "publishedDate": "2026-03-30"
      }
    ]
  }
}
```

### 6.2 GET /news/:id
Description: Returns a single news item by ID.
Access: Public

Response `200`: 
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "title": "Service Update",
    "category": "Operations",
    "content": "New schedule effective from Monday. All passengers are advised to follow updated timings.",
    "image": "https://example.com/image1.jpg",
    "publishedDate": "2026-04-01",
    "publishedBy": "SLTB Authority"
  }
}
```

### 6.3 POST /news
Description: Creates a news item.
Access: Admin only

Body:

```json
{
  "title": "Service Update",
  "category": "Operations",
  "content": "New schedule effective from Monday.",
  "image": "https://example.com/news/image.jpg"
}
```

Response `201`: 
```json
{
  "success": true,
  "message": "News created successfully",
  "data": {
    "id": 3,
    "title": "Service Update",
    "category": "Operations",
    "content": "New schedule effective from Monday.",
    "image": "https://example.com/image.jpg",
    "publishedDate": "2026-04-01",
    "publishedBy": "SLTB Authority",
  }
}
```

### 6.4 PATCH /news/:id
Description: Updates an existing news item by ID.
Access: Admin only
Body:
```json
{
  "title": "Updated Service Notice",
  "content": "Updated schedule with revised timings."
}
```

Response `200`: 
```json
{
  "success": true,
  "message": "News updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Service Notice",
    "category": "Operations",
    "content": "Updated schedule with revised timings.",
    "image": "https://example.com/image.jpg",
    "publishedDate": "2026-04-01",
    "publishedBy": "SLTB Authority"
  }
}
```

### 6.5 DELETE /news/:id
Description: Soft deletes a news item so it no longer appears in default queries.(`isDeleted = true`)
Access: Admin only

Response `200`:

```json
{
  "success": true,
  "message": "News deleted successfully",
  "data": null
}
```
---

## 7. Alert Endpoints

### 7.1 POST /alerts
Description: Send alerts for passenger. (`affectedBus, affectedRoute, targetRoute` are optional. if `targetRoute` is not provided it will be a public alert.)
Access: Admin
Body:
```json
{
  "alertType": "delay",
  "title": "Bus Delay on Colombo-Kandy Route",
  "description": "All buses on the Colombo to Kandy route are experiencing 15 minutes delay due to traffic congestion.",
  "targetAudience": "route",
  "affectedRoute": "Colombo to Kandy",
  "affectedBus": null
}
```
Response `201`: 
```json
{
    "success": true,
    "message": "Alert created successfully",
    "data": {
        "recipientCount": 2,
        "isDeleted": false,
        "id": 29,
        "alertType": "delay",
        "affectedRoute": "Colombo to Kandy",
        "affectedBus": null,
        "title": "Bus Delay on Colombo-Kandy Route",
        "description": "All buses on the Colombo to Kandy route are experiencing 15 minutes delay due to traffic congestion.",
        "targetAudience": "route",
        "scheduledAt": null,
        "status": "sent",
        "sentAt": "2026-06-10T15:55:40.451Z",
        "createdBy": 2,
        "updatedAt": "2026-06-10T15:55:40.451Z",
        "createdAt": "2026-06-10T15:55:40.391Z",
        "deliveryMeta": {
            "targetAudience": "route",
            "affectedRoute": "Colombo to Kandy",
            "affectedBus": null,
            "dispatchedAt": "2026-06-10T15:55:40.451Z"
        }
    }
}
```
### 7.2 GET /alerts/history
Description: Get alerts history(created only by admin role)
Access: Admin
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
          "total": 26,
          "page": 1,
          "totalPages": 3,
          "alerts": [
              {
                  "id": 29,
                  "alertType": "delay",
                  "affectedRoute": "Colombo to Kandy",
                  "affectedBus": null,
                  "title": "Bus Delay on Colombo-Kandy Route",
                  "description": "All buses on the Colombo to Kandy route are experiencing 15 minutes delay due to traffic congestion.",
                  "targetAudience": "route",
                  "status": "sent",
                  "scheduledAt": null,
                  "sentAt": "2026-06-10T15:55:40.000Z",
                  "recipientCount": 2,
                  "deliveryMeta": {
                      "affectedBus": null,
                      "dispatchedAt": "2026-06-10T15:55:40.451Z",
                      "affectedRoute": "Colombo to Kandy",
                      "targetAudience": "route"
                  },
                  "createdBy": 2,
                  "isDeleted": false,
                  "createdAt": "2026-06-10T15:55:40.000Z",
                  "updatedAt": "2026-06-10T15:55:40.000Z",
                  "createdByInfo": {
                      "role": "admin",
                      "id": 2,
                      "name": "System Admin",
                      "displayName": "System Admin"
                  }
              }
          ]
  }
}
```
### 7.3 GET /alerts/history/all
Description: Get all alerts created by both bus and admin users.
Access: Admin
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
          "total": 29,
          "page": 1,
          "totalPages": 3,
          "alerts": [
              {
                  "id": 29,
                  "alertType": "delay",
                  "affectedRoute": "Colombo to Kandy",
                  "affectedBus": null,
                  "title": "Bus Delay on Colombo-Kandy Route",
                  "description": "All buses on the Colombo to Kandy route are experiencing 15 minutes delay due to traffic congestion.",
                  "targetAudience": "route",
                  "status": "sent",
                  "scheduledAt": null,
                  "sentAt": "2026-06-10T15:55:40.000Z",
                  "recipientCount": 2,
                  "deliveryMeta": {
                      "affectedBus": null,
                      "dispatchedAt": "2026-06-10T15:55:40.451Z",
                      "affectedRoute": "Colombo to Kandy",
                      "targetAudience": "route"
                  },
                  "createdBy": 2,
                  "isDeleted": false,
                  "createdAt": "2026-06-10T15:55:40.000Z",
                  "updatedAt": "2026-06-10T15:55:40.000Z",
                  "createdByInfo": {
                      "role": "admin",
                      "id": 2,
                      "name": "System Admin",
                      "displayName": "System Admin"
                  }
              }
          ]
  }
}
```
### 7.4 POST alerts/bus/send
Description: Bus can send alerts to passenger that have subscribed to the route.
Access: Authenticated
Body:
```json
{
  "alertType": "breakdown",
  "title": "Bus Breakdown Alert",
  "description": "Bus WP NA-1234 on Route 100 has experienced a breakdown.",
  "affectedBus": "WP NA-1234"
}
```
Response `201`:
```json
{
    "success": true,
    "message": "Bus alert sent successfully",
    "data": {
        "recipientCount": 0,
        "isDeleted": false,
        "id": 33,
        "alertType": "breakdown",
        "affectedRoute": "Route 100",
        "affectedBus": "WP NA-1234",
        "title": "Bus Breakdown Alert",
        "description": "Bus WP NA-1234 on Route 100 has experienced a breakdown.",
        "targetAudience": "route",
        "status": "sent",
        "sentAt": "2026-06-10T16:19:33.889Z",
        "createdBy": 18,
        "updatedAt": "2026-06-10T16:19:33.889Z",
        "createdAt": "2026-06-10T16:19:33.846Z",
        "deliveryMeta": {
            "targetAudience": "route",
            "affectedRoute": "Route 100",
            "affectedBus": "WP NA-1234",
            "dispatchedAt": "2026-06-10T16:19:33.889Z"
        }
    }
}
```
### 7.5 GET alerts/bus/history
Description: Get recent alerts sent by Bus user.
Access: Authorization
Response `200`:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "total": 18,
        "page": 1,
        "totalPages": 2,
        "alerts": [
            {
                "id": 44,
                "alertType": "breakdown",
                "affectedRoute": "Route 100",
                "affectedBus": "WP NA-1234",
                "title": "Bus Breakdown Alert",
                "description": "Bus WP NA-1234 on Route 100 has experienced a breakdown.",
                "targetAudience": "route",
                "status": "sent",
                "scheduledAt": null,
                "sentAt": "2026-06-10T16:33:31.000Z",
                "recipientCount": 0,
                "deliveryMeta": {
                    "affectedBus": "WP NA-1234",
                    "dispatchedAt": "2026-06-10T16:33:31.013Z",
                    "affectedRoute": "Route 100",
                    "targetAudience": "route"
                },
                "createdBy": 18,
                "isDeleted": false,
                "createdAt": "2026-06-10T16:33:31.000Z",
                "updatedAt": "2026-06-10T16:33:31.000Z"
            }
        ]
    }
}
```
### 7.6 GET /alerts/feed
Description: Returns public alerts + alerts for the passenger's subscribed routes
Access: Authenticated
Response:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "total": 23,
        "page": 1,
        "totalPages": 3,
        "alerts": [
            {
                "id": 25,
                "alertType": "breakdown",
                "affectedRoute": "Route 100",
                "affectedBus": "WP NA-1234",
                "title": "Bus Breakdown Alert",
                "description": "Bus WP NA-1234 on Route 100 has experienced a breakdown.",
                "status": "sent",
                "scheduledAt": null,
                "sentAt": "2026-05-20T14:42:20.000Z",
                "recipientCount": 7,
                "deliveryMeta": {
                    "affectedBus": "WP NA-1234",
                    "dispatchedAt": "2026-05-20T14:42:20.246Z",
                    "affectedRoute": "Route 100",
                    "targetAudience": "public"
                },
                "createdBy": 2,
                "isDeleted": false,
                "createdAt": "2026-05-20T14:42:20.000Z",
                "updatedAt": "2026-05-20T14:42:20.000Z"
            }
        ]
    }
}
```
### 7.7 GET alerts/:id
Description: Get alerts by id(Admin/Passenger)
Access: Authorized
Response:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "id": 5,
        "title": "Bus Breakdown",
        "alertType": "breakdown",
        "affectedBus": "WP NA-1234",
        "affectedRoute": "Route 100",
        "sentAt": "2026-05-20T08:33:11.000Z",
        "description": "Bus WP NA-1234 on Route 100 has experienced a breakdown."
    }
}
```
## 8. Feeback Endpoints

### 8.1 POST /feedback
Description: Passenger can submit feedback
Access: Authenticated
Body: 
```json
{
  "category": "Service",
  "rating": 5,
  "message": "Very good service!"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 1,
    "category": "Service",
    "rating": 5,
    "message": "Very good service!",
    "status": "pending",
    "createdAt": "2026-04-01"
  }
}
```
### 8.2 GET /feedback
Decsription: Show recent feedback from other passengers
Access: Public
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "feedback": [
      {
        "id": 1,
        "firstName": "Nimal",
        "category": "Service",
        "rating": 5,
        "message": "Excellent service, very comfortable journey.",
        "createdAt": "2026-04-01"
      },
      {
        "id": 2,
        "firstName": "Kamal",
        "category": "Punctuality",
        "rating": 3,
        "message": "Bus was late by 15 minutes.",
        "createdAt": "2026-04-01"
      }
    ]
  }
}
```
### 8.3 GET /feedback/admin
Description: Get all feedback for admin view.
Access: admin
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "feedback": [
      {
        "id": 1,
        "user": {
          "id": 2,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "category": "Service",
        "rating": 5,
        "message": "Excellent service",
        "createdAt": "2026-04-01"
      },
      {
        "id": 2,
        "user": {
          "id": 3,
          "firstName": "Kamal",
          "lastName": "Perera",
          "email": "kamal@example.com"
        },
        "category": "Driver",
        "rating": 2,
        "message": "Driver was rude",
        "createdAt": "2026-04-01"
      }
    ]
  }
}
```
### 8.4 GET /feedback/:id
Description: See full feedback
Access: Admin
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "userId": 2,
    "category": "Service",
    "rating": 5,
    "message": "Excellent service, very comfortable journey.",
    "createdAt": "2026-04-01"
  }
}
```
### 8.5 DELETE Feeback/:id
Description: Delete a feedback.
Access: Admin
Response `200`:
```json
{
  "success": true,
  "message": "Feedback deleted successfully",
  "data": null
}
```
### 8.6 GET /feedback/my
Description: Passenger can see own feedback.
Access: Authenticated
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "feedback": [
      {
        "id": 1,
        "category": "Service",
        "rating": 5,
        "message": "Excellent service, very comfortable journey.",
        "createdAt": "2026-04-01"
      },
      {
        "id": 3,
        "category": "Punctuality",
        "rating": 3,
        "message": "Bus was late by 10 minutes.",
        "createdAt": "2026-03-31"
      }
    ]
  }
}
```

## 9. Complaint Endpoints

### 9.1 POST /complaints
Decsription: Passengers can submit complaints.
Access: Authenticated
Body:
```json
{
  "category": "Bus Condition",
  "busNumber": "NA-1010",
  "content": "Air conditioning not working properly."
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "id": 1,
    "category": "Bus Condition",
    "busNumber": "NA-1010",
    "content": "Air conditioning not working properly.",
    "status": "Pending",
    "submittedBy": {
      "id": 10,
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2026-04-01"
  }
}
```
### 9.2 GET /complaints/my
Description: passenger can see own complaints
Access: Authenticated
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "complaints": [
      {
        "id": 1,
        "category": "Bus Condition",
        "busNumber": "NA-1010",
        "content": "Air conditioning not working properly.",
        "status": "Pending",
        "createdAt": "2026-04-01"
      },
      {
        "id": 3,
        "category": "Driver Behavior",
        "busNumber": "NA-1010",
        "content": "Driver was rude to passengers.",
        "status": "Resolved",
        "createdAt": "2026-03-31"
      }
    ]
  }
}
```
### 9.3 GET /complaints
Description: Admin get a list of complaints.
Access: Admin
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "complaints": [
      {
        "id": 1,
        "category": "Bus Condition",
        "busNumber": "NA-1010",
        "content": "Air conditioning not working properly.",
        "status": "Pending",
        "submittedBy": {
          "id": 10,
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2026-04-01"
      },
      {
        "id": 2,
        "category": "Driver Behavior",
        "busNumber": "NA-1010",
        "content": "Driver not following route properly.",
        "status": "Resolved",
        "submittedBy": {
          "id": 12,
          "firstName": "Jane",
          "lastName": "Doe"
        },
        "createdAt": "2026-03-30"
      }
    ]
  }
}
```
### 9.4 GET /complaints/:id
Description: See one item of complaint.
Access: Admin
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "category": "Bus Condition",
    "busNumber": "NA-1102",
    "content": "Air conditioning not working properly.",
    "status": "Pending",
    "submittedBy": {
      "id": 10,
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2026-04-01"
  }
}
```
### 9.5 PUT /complaints/:id
Description: Update complain status
Access: Admin
Body:
```json
{
  "status": "Resolved"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Complaint updated successfully",
  "data": {
    "id": 1,
    "category": "Bus Condition",
    "busNumber": "NA-1020",
    "content": "Air conditioning not working properly.",
    "status": "Resolved",
    "submittedBy": {
      "id": 10,
      "firstName": "Jogn",
      "lastName": "Doe"
    },
    "updatedAt": "2026-04-01"
  }
}
```
## 10. Bus Reports Endpoints

### 10.1 POST /reports
Description: Submit Bus reports
Access: Authenticated
Body:
```json
{
  "content": "The bus engine made unusual noise near Kadugannawa. Needs inspection.",
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Bus report submitted successfully",
  "data": {
    "id": 1,
    "busNumber": "NA-111",
    "content": "The bus engine made unusual noise near Kadugannawa. Needs inspection.",
    "status": "Pending",
    "createdAt": "2026-04-01"
  }
}
```
### 10.2 GET /reports
Description: REceive bus reports
Access: Admin
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "busNumber": "NA-1234",
      "content": "The bus engine made unusual noise near Kadugannawa. Needs inspection.",
      "status": "Pending",
      "createdAt": "2026-04-01"
    },
    {
      "id": 2,
      "busNumber": "B456",
      "content": "Brake pedal feels soft. Requires maintenance.",
      "status": "Reviewed",
      "createdAt": "2026-04-01"
    }
  ]
}
```

## 11. Live Tracking Endpoints

### 11.1 POST /buses/live/location
Description: Used by a bus to push its current GPS location.
Access: Authenticated
Body:
```json
{
  "latitude": 6.9271,
  "longitude": 79.8612,
  "gpsOn": true,
  "routeId": 3,
  "routeName": "Colombo - Kandy",
  "timestamp": "2026-06-21T10:15:00.000Z"
}
```
Response `200`: 
```json
{
    "success": true,
    "message": "Live location updated",
    "data": {
        "busId": 1,
        "busUserId": 18,
        "registrationNumber": "WP NA-1234",
        "busType": "Regular",
        "totalSeats": 45,
        "routeId": 1,
        "routeName": "Route 100",
        "from": "Panadura",
        "to": "Pettah",
        "latitude": 6.9271,
        "longitude": 79.8612,
        "status": "stale",
        "lastUpdated": "2026-06-21T10:15:00.000Z",
        "gpsEnabled": true,
        "distanceFromPassenger": null,
        "staleAfterSeconds": 35
    }
}
```
### 11.2 GET /buses/live/nearby
Description: Returns active buses within a radius of the passenger's location.
Access: Authenticated
(/nearby?latitude=6.9271&longitude=79.8612&radiusKm=10&limit=20)
Response `200`:
```json
{
    "success": true,
    "message": "Nearby buses fetched",
    "data": {
        "passenger": {
            "latitude": 6.9271,
            "longitude": 79.8612
        },
        "radiusKm": 10,
        "count": 1,
        "buses": [
            {
                "busId": 1,
                "busUserId": 18,
                "registrationNumber": "WP NA-1234",
                "busType": "Regular",
                "totalSeats": 45,
                "routeId": 1,
                "routeName": "Route 100",
                "from": "Panadura",
                "to": "Pettah",
                "latitude": 6.9271,
                "longitude": 79.8612,
                "status": "stale",
                "lastUpdated": "2026-06-21T10:15:00.000Z",
                "gpsEnabled": true,
                "distanceFromPassenger": 0,
                "staleAfterSeconds": 35
            }
        ],
        "pollingIntervalSeconds": 10
    }
}
```
### 11.3 GET /buses/live/route
Description: Returns buses currently on a specific route, optionally sorted by distance from the passenger.
Access: Authenticated
(/route?routeName=Route 100)
Response `200`:
```json
{
    "success": true,
    "message": "Route buses fetched",
    "data": {
        "route": {
            "id": 1,
            "routeName": "Route 100",
            "from": "Panadura",
            "to": "Pettah"
        },
        "passenger": null,
        "count": 1,
        "buses": [
            {
                "busId": 1,
                "busUserId": 18,
                "registrationNumber": "WP NA-1234",
                "busType": "Regular",
                "totalSeats": 45,
                "routeId": 1,
                "routeName": "Route 100",
                "from": "Panadura",
                "to": "Pettah",
                "latitude": 6.9271,
                "longitude": 79.8612,
                "status": "stale",
                "lastUpdated": "2026-06-21T10:15:00.000Z",
                "gpsEnabled": true,
                "distanceFromPassenger": null,
                "staleAfterSeconds": 35
            }
        ],
        "pollingIntervalSeconds": 10
    }
}
```
## 12. Route Finder Endpoints

### 12.1 GET /route-finder
Description: Find routes from start to end points.
Access: Authenticated
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "routeId": 1,
      "routeName": "Pettah - Kottawa",
      "estimatedTime": "45m"
    },
    {
      "routeId": 2,
      "routeName": "Homagama - Townhall",
      "estimatedTime": "30m"
    }
  ]
}
```

## 13. Lost & Found Endpoints

### 13.1 POST /lost-items
Description: Passenger can post a lost item post
Access: Authorization
Body:
```json
{
  "name": "Wallet",
  "image": "https://example.com/images/wallet.jpg",
  "location": "Fort Bus Station",
  "content": "Black leather wallet containing ID and cards. If found, contact 0xx-xxxxxxx"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Lost item submitted successfully",
  "data": {
    "id": 101,
    "name": "Wallet",
    "image": "https://example.com/images/wallet.jpg",
    "location": "Fort Bus Station",
    "description": "Black leather wallet containing ID and cards. If found, contact 0xx-xxxxxxx",
    "status": "Pending",
    "submittedAt": "2026-04-01"
  }
}
```

### 13.2 POST /found-items
Description: Passengers can post found items.
Access: Authorization
Body:
```json
{
  "name": "Umbrella",
  "image": "https://example.com/images/umbrella.jpg",
  "location": "Colombo Fort",
  "description": "Red umbrella left in bus NA-1234 - Fort - Homagama. Collet from Colombo Fort Depot."
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Found item submitted successfully",
  "data": {
    "id": 55,
    "name": "Umbrella",
    "image": "https://example.com/images/umbrella.jpg",
    "location": "Colombo Fort",
    "description": "Red umbrella left in bus NA-1234 - Fort - Homagama. Collet from Colobo Fort Depot.",
    "submittedAt": "2026-04-01"
  }
}
```

### 13.3 GET /lost-items
Description: Get list of lost items.
Access: Public
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "name": "Wallet",
      "image": "https://example.com/images/wallet.jpg",
      "location": "Fort Bus Station",
      "description": "Black leather wallet containing ID and cards. Call 0xxxxxxxxxx",
      "status": "Pending",
      "submittedAt": "2026-04-01"
    },
    {
      "id": 102,
      "name": "Keys",
      "image": "https://example.com/images/keys.jpg",
      "location": "Kandy Rd",
      "description": "Set of house keys. Call 0xxxxxxxxx.",
      "status": "Pending",
      "submittedAt": "2026-04-01"
    }
  ]
}
```

### 13.4 GET /found-items
Description: Get a list of found items
Access: Public
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 55,
      "name": "Umbrella",
      "image": "https://example.com/images/umbrella.jpg",
      "location": "Colombo Fort",
      "description": "Red umbrella left in bus NA-1234, Collect from Colombo Fort Bus Depot",
      "status": "Pending",
      "submittedAt": "2026-04-01"
    },
    {
      "id": 56,
      "name": "Wallet",
      "image": "https://example.com/images/wallet2.jpg",
      "location": "Fort Bus Station",
      "description": "Brown wallet found near bus stop, Collect from Colombo Fort Bus Depot",
      "status": "Pending",
      "submittedAt": "2026-04-01"
    }
  ]
}
```
### 13.5 GET /found-items/mine
Description: Get a list of found items submitted by user
Access: Authorized
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 55,
      "name": "Umbrella",
      "image": "https://example.com/images/umbrella.jpg",
      "location": "Colombo Fort",
      "description": "Red umbrella left in bus B123. Collect from Colombo Fort Depot",
      "status": "Pending",
      "submittedAt": "2026-04-01"
    }
  ]
}
```

### 13.6 GET /lost-items/mine
Description: Get a list of lost items submitted by user.
Access: Authorization
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "name": "Wallet",
      "image": "https://example.com/images/wallet.jpg",
      "location": "Fort Bus Station",
      "description": "Black leather wallet containing ID and cards. call 0xxxxxxxxx",
      "status": "Pending",
      "submittedAt": "2026-04-01"
    }
  ]
}
```

### 13.7 PATCH /lost-items/:id
Description: User can edit status of their lost item submitions.
Access: Public
Body:
```json
{
  "status": "Found"
}
```

Response:
```json
{
  "success": true,
  "message": "Lost item status updated successfully",
  "data": {
    "id": 101,
    "name": "Wallet",
    "image": "https://example.com/images/wallet.jpg",
    "location": "Fort Bus Station",
    "description": "Black leather wallet containing ID and cards. call 0xxxxxxxxx",
    "status": "Found",
    "submittedAt": "2026-04-01"
  }
}
```

### 13.8 PATCH /found-items/:id/status
Description: ser can edit status of their found item submitions.
Access: Authorization
Body:
```json
{
  "status": "Found"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Lost item status updated successfully",
  "data": {
    "id": 55,
    "name": "Umbrella",
    "image": "https://example.com/images/umbrella.jpg",
    "location": "Colombo Fort",
    "description": "Red umbrella left in bus B123. Collect from Colombo Fort Depot",
    "status": "Found",
    "submittedAt": "2026-04-01"
  }
}
```

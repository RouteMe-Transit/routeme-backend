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
    "password": "password123",
    "confirmPassword": "password123",
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
    "password": "password123",
    "confirmPassword": "password123",
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
        "routeNumber": "100",
        "routeName": "Panadura - Pettah",
        "routeType": "Express",
        "origin": "Panadura",
        "destination": "Pettah",
        "distance": 25,
        "duration": 180,
        "isActive": true,
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
        ]
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
  "duration": 45
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

### 3.4 SELETE /routes/:id
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

## 4. Bus Endpoints
Access: Admin

### 4.1 GET /buses
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
### 4.2 GET /buses/:id
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

### 4.3 POST /buses
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

### 4.4 PUT /buses/:id
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

### 4.5 DELETE /buses/:id
Description: Deactivates a bus and marks its operational status as inactive. (`isActive = false`, `status = Inactive`)

Response `200`:

```json
{
  "success": true,
  "message": "Bus deactivated successfully",
  "data": null
}
```

### 4.6 PATCH /buses/location
Access: Authenticated
Description: Fetch location from phone logged into bus account.
Body:
```json
{
  "latitude": 6.9271,
  "longitude": 79.8612
}
```
Response `200`:
```json
{
    
  "success": true,
  "message": "Bus location updated successfully",
  "data": {
    "busId": 1,
    "latitude": 6.9271,
    "longitude": 79.8612,
    "recordedAt": "2026-04-01"
  }
}
```

---

## 5. News Endpoints

### 5.1 GET /news
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

### 5.2 GET /news/:id
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

### 5.3 POST /news
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

### 5.4 PATCH /news/:id
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

### 5.5 DELETE /news/:id
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

## 6. Alert Endpoints

### 6.1 POST /alerts
Description: Send alerts for passenger. (`affectedBus, affectedRoute, targetRoute` are optional. if `targetRoute` is not provided it will be a public alert.)
Access: Admin
Body:
```json
{
  "alertType": "Delay",
  "title": "Route 100 Delay",
  "content": "Buses are delayed by 20 minutes.",
  "affectedBusOrRoute": "Route 100 Panadura - Pettah",
  "targetRoute": 1
}
```
Response `201`: 
```json
{
  "success": true,
  "message": "Alert created successfully",
  "data": {
    "id": 1,
    "alertType": "Delay",
    "title": "Route 100 Delay",
    "content": "Buses are delayed by 20 minutes.",
    "affectedBusOrRoute": "Route 100 Panadura - Pettah"
    "targetRoute": 1,
    "isPublic": false,
    "createdAt": "2026-04-01"
  }
}
```
### 6.2 GET /alerts
Description: Get alerts
Access: Authenticated
Response `200`:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "alerts": [
      {
        "id": 1,
        "alertType": "Delay",
        "title": "Route 100 Delay",
        "content": "Buses are delayed by 20 minutes.",
        "affectedRoute": 1,
        "isPublic": false,
        "createdAt": "2026-04-01"
      },
      {
        "id": 2,
        "alertType": "General",
        "title": "Holiday Notice",
        "content": "Special schedules for holidays.",
        "isPublic": true,
        "createdAt": "2026-04-01"
      }
    ]
  }
}
```
### 6.3 DELETE /alerts/:id
Description: Delete alert
Access: Admin

Response `200`:
```json
{
  "success": true,
  "message": "Alert deleted successfully",
  "data": null
}
```

### 6.4 POST /bus-alerts
Description: Bus can send alerts to passenger that have subscribed to the route.
Access: Authenticated
Body:
```json
{
  "alertType": "Delay", 
  "routeId": 3, 
     
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Alert sent successfully",
  "data": {
    "id": 15,
    "busNumber": "NA-1234",
    "routeId": 3,
    "alertType": "Delay",
    "sentAt": "2026-04-01"
  }
}
```
### 6.5 GET /bus-alerts
Description: Get recent own alerts sent by Bus.
Access: Authorixation
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "alertType": "Delay",
      "sentAt": "2026-04-01"
    },
    {
      "id": 14,
      "sentAt": "2026-04-01"
    }
  ]
}
```
## 7. Feeback Endpoints

### 7.1 POST /feedback
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
### 7.2 GET /feedback
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
### 7.3 GET /feedback/admin
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
### 7.3 GET /feedback/:id
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
### 7.3 DELETE Feeback/:id
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
### 7.4 GET /feedback/my
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

## 8. Complaint Endpoints

### 8.1 POST /complaints
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
### 8.2 GET /complaints/my
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
### 8.3 GET /complaints
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
### 8.4 GET /complaints/:id
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
### 8.5 PUT /complaints/:id
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
## 9. Bus Reports Endpoints

### 9.1 POST /reports
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
### 9.2 GET /reports
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

## 10. Live Tracking Endpoints

### 10.1 GET /tracking/:routeId
Description: Get Live Location of Buses for Passenger.(routeId is optional apply only if passneger select route.)
Access: Authenticated
Response `200`: 
```json
{
  "success": true,
  "data": {
    "routeId": 1,
    "routeName": "Colombo–Kandy Express",
    "buses": [
      {
        "busNumber": "NA-1222",
        "currentLocation": {
          "lat": 7.2906,
          "lng": 80.6337
        },
        "lastUpdated": "2026-04-01"
      },
      {
        "busNumber": "NA-1233",
        "currentLocation": {
          "lat": 7.2950,
          "lng": 80.6400
        },
        "lastUpdated": "2026-04-01"
      }
    ]
  }
}
```
## 11. Route Finder Endpoints

### 11.1 GET /route-finder
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

## 12. Lost & Found Endpoints

### 12.1 POST /lost-items
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

### 12.2 POST /found-items
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

### 12.3 GET /lost-items
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

### 12.4 GET /found-items
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
### 12.5 GET /found-items/mine
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

### 12.6 GET /lost-items/mine
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

### 12.7 PATCH /lost-items/:id
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

### 12.8 PATCH /found-items/:id/status
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

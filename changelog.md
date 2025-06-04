# Changelog

## [1.0.3] - 2025-06-02

### Updated

- JWT token payload now includes only the user's ID.
  - Removed user's name and email from the token to enhance security and reduce token size.
  - The token contains only the unique user identifier (`id`), minimizing exposure of personal information.

## [1.0.0] - 2025-06-01

### Added

- Implemented multi-device login management:
  - On **mobile devices**, logging in from a new device automatically logs out previous mobile sessions, keeping only the latest device logged in.
  - On **web browsers**, multiple simultaneous logins are allowed without automatic logout.
  - An OTP is sent to the user's email when logging in from a new mobile device for verification.
  - **Request headers requirement:**
    - For mobile device requests, the following headers **must** be included:
      - `x-device-type: mobile`
      - `x-device-id: 12345678` (unique device identifier)
    - For web browser requests, **no additional headers** are required.

## [1.0.0] - 2025-05-28

### Added

- **Superuser Authorization Update:**
  - Superusers can now log in using their email to obtain a token via Postman.
  - This token can be used as a Bearer token to perform any authorized actions within the application.
  - For the route `https://group-api-b4pm.onrender.com/api/groups/leave/5736317d-ab90-42c6-b42e-f95cf1ba5faf`, the request body must include the following data:
    ```json
    {
      "userId": "662bd7aafb84f9fca26837ce"
    }
    ```

## [1.0.0] - 2025-05-25

### Added Joi Validation

- **Comprehensive Input Validation:** Implemented Joi validation across the entire application to ensure consistent and secure data handling.
- **Key Features of Joi Validation:**
  - Validates incoming request data (e.g., query parameters, request body, headers) to ensure accuracy and prevent invalid or malicious input.
  - Offers clear and detailed error messages to assist developers in debugging and enhancing user experience.
  - Simplifies schema definitions, making validation rules more readable and maintainable.
- **Benefits:**
  - Enhances application reliability by minimizing runtime errors caused by invalid data.
  - Improves security by filtering potentially harmful inputs at the entry point.
- **Example:**  
  Here's a sample schema used for validating user input:

  ```typescript
  import Joi from "joi";

  const userSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  // Validation usage
  const validationResult = userSchema.validate(inputData);
  if (validationResult.error) {
    throw new Error(validationResult.error.details[0].message);
  }
  ```

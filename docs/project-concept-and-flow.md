# BodaRequest Project Concept And Flow

## 1. Product Summary

BodaRequest is a ride-booking and operations platform for boda boda transport. The system supports three user groups:

- Customers: request rides, see the estimated cost, make a demo payment, and track trip progress
- Riders: receive paid ride requests, confirm them, start the trip, and complete it
- Admins: monitor daily trips, payments, rider activity, and high-level performance

This first version is a working prototype meant to demonstrate the business flow. Payment is intentionally demo-only for now.

## 2. Main Goals

- Let customers create a request using pickup and destination details
- Show pricing before the request is sent to riders
- Require a payment step before a request becomes visible to riders
- Give riders a clear board for available and assigned trips
- Give admins a dashboard for operational visibility
- Keep the interface attractive, responsive, and easy to use on phone and desktop

## 3. User Roles

### Customer

- Registers and logs in
- Enters trip details
- Gets a fare estimate
- Creates a ride request
- Completes a demo payment
- Waits for rider confirmation
- Tracks ride status until completion

### Rider

- Registers and logs in as rider
- Views paid requests waiting for assignment
- Accepts one request
- Starts the trip after pickup
- Completes the trip after drop-off

### Admin

- Logs in to the admin dashboard
- Monitors ride demand and active trips
- Reviews payment records
- Tracks rider performance and availability

## 4. Core Ride Lifecycle

The ride lifecycle in this prototype follows this order:

1. `pending_payment`
   Customer has created the ride request, but it is not visible to riders yet.

2. `waiting_rider`
   Demo payment is completed. The trip is now available for riders to confirm.

3. `rider_assigned`
   A rider accepts the trip and becomes responsible for it.

4. `in_progress`
   The rider starts the trip after pickup.

5. `completed`
   The rider completes the ride. Admin reporting and rider earnings update from here.

## 5. Customer Flow

1. Customer opens the landing page
2. Customer creates an account or logs in
3. Customer fills:
   Pickup location
   Destination
   Distance in kilometers
   Pickup note
   Destination note
   Preferred pickup time
   Priority level
   Passenger count
   Helmet support option
   Extra notes
4. System calculates the fare
5. Customer clicks create trip
6. Trip is stored with `pending_payment`
7. Customer completes demo payment
8. Trip status changes to `waiting_rider`
9. Customer waits for rider confirmation
10. Customer sees status updates until `completed`

## 6. Rider Flow

1. Rider logs in
2. Rider opens available ride requests
3. Rider sees paid rides only
4. Rider confirms one ride
5. Trip moves to `rider_assigned`
6. Rider starts the trip
7. Trip moves to `in_progress`
8. Rider completes the trip
9. Trip moves to `completed`
10. Rider performance values update

## 7. Admin Flow

1. Admin logs in
2. Admin sees:
   Trips created today
   Revenue collected today
   Number of active trips
   Total rider accounts
3. Admin reviews:
   Recent trips
   Payment stream
   Rider performance cards
   Simple payment trend chart

## 8. Pricing Logic

The prototype uses a transparent demo pricing formula:

- Base fare
- Distance charge per kilometer
- Small extra charge for additional passengers
- Helmet support surcharge when requested
- Service fee
- Priority multiplier for faster or scheduled service

This is enough for the prototype and can later be replaced with real route-distance APIs and production pricing rules.

## 9. Demo Payment Logic

This version does not connect to a real gateway. Instead:

- Customer creates a trip
- Customer clicks a demo payment button
- System marks the trip as paid
- System stores a demo transaction reference
- Riders can now see the request

This keeps the business flow realistic without adding real financial integration yet.

## 10. Suggested Future Improvements

- Real maps and geolocation
- Real distance and ETA calculation
- Live rider location tracking
- Push or SMS notifications
- Real payment gateway integration
- Cancellation logic and penalties
- Rider wallet and settlement logic
- Admin filtering, exports, and alerts
- Customer trip history analytics
- Role creation restrictions for production security

## 11. Technical Structure

### Frontend

- React with Vite
- Responsive blue-themed UI
- Dark mode included
- Role-based dashboard views
- Animated landing page and data cards

### Backend

- Node.js + Express API
- JWT authentication
- MySQL database
- Role-protected endpoints for customer, rider, and admin actions

### Database

Key tables:

- `users`
- `rider_profiles`
- `ride_requests`
- `payments`

## 12. Why This Flow Works

This structure solves the main operational needs:

- Customers see cost before committing
- Riders only receive paid and actionable requests
- Admins can monitor trips, money movement, and rider output
- The lifecycle is simple enough to demo and strong enough to extend into a real product

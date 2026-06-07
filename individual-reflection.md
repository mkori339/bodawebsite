# Individual Reflection: MQTT in the Bodaboda System

## MQTT Definition

MQTT stands for Message Queuing Telemetry Transport. It is a lightweight communication protocol used to send messages between devices, applications, or services in real time. MQTT uses a publish and subscribe model. This means one part of the system can publish a message to a topic, and another part of the system can subscribe to that topic and receive the message immediately.

In MQTT, there is a broker that acts like the middle point. The publisher does not send the message directly to the receiver. Instead, the publisher sends the message to the broker, and the broker delivers it to all subscribers who are listening to that topic. In my Bodaboda system, the Mosquitto broker was used as the MQTT broker.

## Difference Between HTTP and MQTT

HTTP is a request and response protocol. This means the client must send a request to the server, and then the server sends back a response. For example, when a rider dashboard wants to see new ride requests using HTTP, it must ask the backend again by refreshing the page or calling the API again.

MQTT works differently because it is event-based. A client can subscribe to a topic and wait for messages. When a new message is published, the subscriber receives it immediately without repeatedly asking the server. This makes MQTT better for real-time updates.

Another difference is that HTTP is commonly used for websites, APIs, forms, login, and normal data fetching. MQTT is commonly used for real-time alerts, IoT devices, vehicle tracking, delivery systems, and live notifications. HTTP is good when the user asks for data, while MQTT is good when the system needs to push updates instantly.

In short, HTTP is like asking, “Is there any new update?” again and again. MQTT is like saying, “Notify me immediately when there is a new update.”

## How MQTT Improved My Bodaboda System

MQTT improved my Bodaboda system by making ride request communication more real time. Before MQTT, the rider had to refresh the dashboard or wait for the frontend to fetch data again in order to see new ride requests. This was not very efficient for a transport system because riders need to receive ride requests quickly.

After adding MQTT, when a customer pays for a ride, the backend publishes a message to the topic `ride/request`. The MQTT broker receives the message and sends it to subscribers. This means a rider or subscriber client can receive the ride request immediately.

I also added ride status messages using the topic `ride/status`. These messages are published when a rider accepts, starts, or completes a trip. This helps the system communicate trip progress faster between the backend and dashboards.

The main improvement is that the system became closer to a real transport application. Ride requests and trip updates can be sent as events instead of depending only on manual refresh. This improves speed, user experience, and communication between customers and riders.

## Real-World Application Example

A real-world example of this idea is Uber or Bolt. In these systems, when a customer requests a ride, nearby drivers receive the request quickly. The customer can also see updates such as driver accepted, driver arriving, trip started, and trip completed. These updates happen almost immediately.

This is similar to how MQTT works in my Bodaboda system. The customer action creates an event, and the rider side receives the update quickly. For example, when a customer pays for a ride, the system publishes a ride request event. When a rider accepts the ride, the system publishes a ride status event.

In Tanzania, this kind of real-time communication can be useful for Bodaboda platforms, delivery services, ambulance dispatch systems, parcel tracking, and mobile money notifications. Any system that needs fast updates between users can benefit from MQTT or similar real-time communication technology.


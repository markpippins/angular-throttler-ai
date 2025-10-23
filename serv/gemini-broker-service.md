# Broker Service and Gateway

This document provides a detailed explanation of the broker service architecture used by the application.

## Overview

The broker service acts as a central hub for dispatching requests to various backend services. It provides a single entry point for clients and routes requests to the appropriate service based on the service name and operation specified in the request.

**Architectural Note:** A key reason for this broker-based architecture is to serve as a **unified API Gateway** or **proxy** that hides a collection of smaller, independent Node.js microservices (e.g., a file service, an image service, a search service). The client application only needs to know about a single, stable endpoint (`brokerUrl`). This decouples the frontend from the backend's internal structure, allowing backend services to be added, removed, or reconfigured without requiring any changes to the client-side code.

## Architecture

The broker system is composed of three main parts:

1.  **Client-Side Service (`src/services/broker.service.ts`)**: An Angular service responsible for constructing and sending requests.
2.  **API Gateway (The Broker)**: A conceptual component that would exist at the `brokerUrl`. This gateway is responsible for receiving client requests and routing them to the correct backend microservice. This component is not implemented in this project but could be built with tools like Express Gateway, Nginx, or a custom Node.js application.
3.  **Backend Microservices (`serv/*`)**: A collection of standalone Node.js servers, each handling a specific domain of responsibility (e.g., file operations, image serving).

### Request and Response Flow

The client-side `BrokerService` defines the data structure for requests and responses.

-   **`ServiceRequest`**: Represents a request sent from the client to the API Gateway. It contains the following fields:
    -   `service`: The name of the service to call (e.g., `"restFsService"`).
    -   `operation`: The name of the operation to perform (e.g., `"listFiles"`).
    -   `params`: A map of parameters for the operation.
    -   `requestId`: A unique identifier for the request.
-   **`ServiceResponse`**: Represents a response from a microservice, wrapped by the gateway. It contains the following fields:
    -   `ok`: A boolean indicating whether the request was successful.
    -   `data`: The result of the operation.
    -   `errors`: A list of errors that occurred during the operation.
    -   ...and other metadata like `requestId`, `ts`, etc.

## Usage

To use the broker architecture, the frontend makes a request to a configured `brokerUrl`. The API Gateway at that URL is responsible for inspecting the `service` field in the request body and forwarding the request to the appropriate backend microservice.

### Example: File Service

For example, the `file-service` (`serv/file/fs-serv.ts`) is a microservice that handles file system operations.

Here is an example of the frontend calling the `listFiles` operation.

```json
{
    "service": "restFsService",
    "operation": "listFiles",
    "params": {
        "alias": "Local (Debug)",
        "path": []
    },
    "requestId": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
}
```

This `ServiceRequest` object would be sent via `POST` to the `brokerUrl` (e.g., `http://localhost:8080/api/broker/submitRequest`). The API Gateway would see that `service` is `"restFsService"` and route the request to the File Service microservice running on its own port. The microservice processes the operation and returns its result, which the gateway then wraps in a `ServiceResponse` and sends back to the client.
import { parse } from "uri-template";
import type { HostBookingsClientContext } from "./hostBookingsClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonCreateBookingRequestToTransportTransform,
} from "../../models/internal/serializers.js";
import type {
  ApiError,
  Booking,
  CreateBookingRequest,
} from "../../models/models.js";

export interface ListHostBookingsOptions extends OperationOptions {}
export async function listHostBookings(
  client: HostBookingsClientContext,
  slug: string,
  options?: ListHostBookingsOptions,
): Promise<Array<Booking> | ApiError> {
  const path = parse("/api/v1/hosts/{slug}/bookings").expand({
    slug: slug
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }
  throw createRestError(response);
}
;
export interface CreateBookingOptions extends OperationOptions {}
export async function createBooking(
  client: HostBookingsClientContext,
  slug: string,
  body: CreateBookingRequest,
  options?: CreateBookingOptions,
): Promise<Booking | ApiError> {
  const path = parse("/api/v1/hosts/{slug}/bookings").expand({
    slug: slug
  });
  const httpRequestOptions = {
    headers: {},body: jsonCreateBookingRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }
  throw createRestError(response);
}
;

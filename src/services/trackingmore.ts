/**
 * TrackingMore API Service
 * 
 * Service layer for interacting with TrackingMore API v4
 * Documentation: https://www.trackingmore.com/api-doc
 */

const TRACKINGMORE_API_BASE = "https://api.trackingmore.com/v4";
const TRACKINGMORE_API_KEY = process.env.NEXT_PUBLIC_TRACKINGMORE_API_KEY || "";

interface TrackingMoreResponse<T> {
  code: number;
  data: T;
  message?: string;
}

interface CreateTrackingRequest {
  tracking_number: string;
  courier_code: string;
  order_id?: string;
  order_date?: string;
  destination_code?: string;
  tracking_ship_date?: string;
  tracking_postal_code?: string;
  specialNumberDestination?: string;
  lang?: string;
  title?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface TrackingEvent {
  checkpoint_time: string;
  checkpoint_date: string;
  tracking_detail: string;
  location?: string;
  country?: string;
  country_name?: string;
  state?: string;
  city?: string;
  zip?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface TrackingInfo {
  id: string;
  tracking_number: string;
  courier_code: string;
  order_id?: string;
  order_date?: string;
  destination_code?: string;
  tracking_ship_date?: string;
  tracking_postal_code?: string;
  specialNumberDestination?: string;
  lang?: string;
  title?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  original_country?: string;
  destination_country?: string;
  lastEvent?: string;
  lastStatus?: string;
  lastUpdateTime?: string;
  origin_info?: {
    TrackingNumber?: string;
    carrier_code?: string;
    destination_code?: string;
    title?: string;
    order_id?: string;
    order_create_time?: string;
    trackinfo?: TrackingEvent[];
  };
  destination_info?: {
    TrackingNumber?: string;
    carrier_code?: string;
    destination_code?: string;
    title?: string;
    order_id?: string;
    order_create_time?: string;
    trackinfo?: TrackingEvent[];
  };
}

/**
 * Create a new tracking in TrackingMore
 */
export async function createTracking(
  params: CreateTrackingRequest,
): Promise<TrackingInfo> {
  if (!TRACKINGMORE_API_KEY) {
    throw new Error("TrackingMore API key is not configured. Please set NEXT_PUBLIC_TRACKINGMORE_API_KEY in your .env.local file");
  }

  // Validate required fields
  if (!params.tracking_number || params.tracking_number.trim() === "") {
    throw new Error("tracking_number is required");
  }

  if (!params.courier_code || params.courier_code.trim() === "") {
    throw new Error("courier_code is required (e.g., 'dhl', 'ups', 'fedex')");
  }

  const requestBody = {
    tracking_number: params.tracking_number,
    courier_code: params.courier_code,
    ...(params.order_id && { order_id: params.order_id }),
    ...(params.order_date && { order_date: params.order_date }),
    ...(params.destination_code && { destination_code: params.destination_code }),
    ...(params.tracking_ship_date && { tracking_ship_date: params.tracking_ship_date }),
    ...(params.tracking_postal_code && { tracking_postal_code: params.tracking_postal_code }),
    ...(params.lang && { lang: params.lang }),
    ...(params.title && { title: params.title }),
  };

  const response = await fetch(`${TRACKINGMORE_API_BASE}/trackings/create`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Tracking-Api-Key": TRACKINGMORE_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  // Try to parse the response
  let result: TrackingMoreResponse<TrackingInfo>;
  try {
    result = await response.json();
  } catch (parseError) {
    const text = await response.text();
    throw new Error(
      `Failed to parse API response (${response.status}): ${text.substring(0, 200)}`,
    );
  }

  // Check if response indicates an error
  // TrackingMore API returns code 200 for success, other codes for errors
  if (result.code !== 200) {
    const errorMessage =
      result.message ||
      (typeof result.data === "string" ? result.data : undefined) ||
      `API error: ${response.status}`;
    
    // Log full error for debugging
    console.error("TrackingMore API Error:", {
      status: response.status,
      code: result.code,
      message: errorMessage,
      requestBody,
      fullResponse: result,
    });

    // Provide helpful error messages for common issues
    if (result.code === 400) {
      throw new Error(
        `Invalid request (400): ${errorMessage}. Please check that tracking_number and courier_code are valid.`,
      );
    }
    if (result.code === 401) {
      throw new Error(
        `Authentication failed (401): ${errorMessage}. Please check your TrackingMore API key.`,
      );
    }
    if (result.code === 404) {
      throw new Error(
        `Tracking not found (404): ${errorMessage}. The tracking number may not exist or the courier code may be incorrect.`,
      );
    }

    throw new Error(
      `TrackingMore API Error (${result.code}): ${errorMessage}`,
    );
  }

  // Ensure data exists
  if (!result.data) {
    throw new Error("API returned success but no data");
  }

  return result.data;
}

/**
 * Get tracking information by tracking number and courier code
 */
export async function getTracking(
  trackingNumber: string,
  courierCode: string,
): Promise<TrackingInfo> {
  if (!TRACKINGMORE_API_KEY) {
    throw new Error("TrackingMore API key is not configured");
  }

  const response = await fetch(
    `${TRACKINGMORE_API_BASE}/trackings/get?tracking_number=${encodeURIComponent(trackingNumber)}&courier_code=${encodeURIComponent(courierCode)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Tracking-Api-Key": TRACKINGMORE_API_KEY,
      },
    },
  );

  let result: TrackingMoreResponse<TrackingInfo>;
  try {
    result = await response.json();
  } catch (parseError) {
    const text = await response.text();
    throw new Error(
      `Failed to parse API response (${response.status}): ${text.substring(0, 200)}`,
    );
  }

  if (!response.ok || result.code !== 200) {
    const errorMessage =
      result.message ||
      result.data?.toString() ||
      `API error: ${response.status}`;
    
    console.error("TrackingMore API Error:", {
      status: response.status,
      code: result.code,
      message: errorMessage,
      trackingNumber,
      courierCode,
      fullResponse: result,
    });

    throw new Error(
      `TrackingMore API Error (${result.code || response.status}): ${errorMessage}`,
    );
  }

  return result.data;
}

/**
 * Get list of all trackings
 */
export async function getTrackingList(params?: {
  page?: number;
  limit?: number;
  courier_code?: string;
  created_date_min?: string;
  created_date_max?: string;
}): Promise<TrackingInfo[]> {
  if (!TRACKINGMORE_API_KEY) {
    throw new Error("TrackingMore API key is not configured");
  }

  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.courier_code) queryParams.append("courier_code", params.courier_code);
  if (params?.created_date_min) queryParams.append("created_date_min", params.created_date_min);
  if (params?.created_date_max) queryParams.append("created_date_max", params.created_date_max);

  const response = await fetch(
    `${TRACKINGMORE_API_BASE}/trackings/get?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Tracking-Api-Key": TRACKINGMORE_API_KEY,
      },
    },
  );

  let result: TrackingMoreResponse<TrackingInfo[]>;
  try {
    result = await response.json();
  } catch (parseError) {
    const text = await response.text();
    throw new Error(
      `Failed to parse API response (${response.status}): ${text.substring(0, 200)}`,
    );
  }

  if (!response.ok || result.code !== 200) {
    const errorMessage =
      result.message ||
      result.data?.toString() ||
      `API error: ${response.status}`;
    
    console.error("TrackingMore API Error:", {
      status: response.status,
      code: result.code,
      message: errorMessage,
      params,
      fullResponse: result,
    });

    throw new Error(
      `TrackingMore API Error (${result.code || response.status}): ${errorMessage}`,
    );
  }

  return result.data || [];
}

/**
 * Delete a tracking
 */
export async function deleteTracking(
  trackingNumber: string,
  courierCode: string,
): Promise<void> {
  if (!TRACKINGMORE_API_KEY) {
    throw new Error("TrackingMore API key is not configured");
  }

  const response = await fetch(
    `${TRACKINGMORE_API_BASE}/trackings/delete?tracking_number=${encodeURIComponent(trackingNumber)}&courier_code=${encodeURIComponent(courierCode)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Tracking-Api-Key": TRACKINGMORE_API_KEY,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  const result: TrackingMoreResponse<null> = await response.json();

  if (result.code !== 200) {
    throw new Error(result.message || "Failed to delete tracking");
  }
}

export type { TrackingInfo, TrackingEvent, CreateTrackingRequest };

# Chain-Guard Troubleshooting Guide

## Common API Errors

### 400 Bad Request

A 400 error from TrackingMore API typically means the request format is invalid. Here are common causes:

#### 1. Missing or Invalid API Key
**Error**: `Authentication failed (401)` or `API error: 400`

**Solution**:
- Check that `NEXT_PUBLIC_TRACKINGMORE_API_KEY` is set in `.env.local`
- Verify the API key is correct (no extra spaces, quotes, etc.)
- Restart the dev server after adding/changing the key
- Get your API key from [TrackingMore Dashboard](https://www.trackingmore.com/api-doc)

#### 2. Invalid Tracking Number
**Error**: `Invalid request (400): tracking_number is invalid`

**Solution**:
- Ensure the tracking number is not empty
- Check the tracking number format matches the courier's format
- Some tracking numbers may already exist in TrackingMore (this is OK, it will return existing data)

#### 3. Invalid Courier Code
**Error**: `Invalid request (400): courier_code is invalid`

**Solution**:
- Use lowercase courier codes: `dhl`, `ups`, `fedex`, `usps`, etc.
- Check the [TrackingMore courier list](https://www.trackingmore.com/courier.html)
- Common codes:
  - `dhl` - DHL
  - `ups` - UPS
  - `fedex` - FedEx
  - `usps` - USPS
  - `tnt` - TNT
  - `dpd` - DPD

#### 4. Missing Required Fields
**Error**: `tracking_number is required` or `courier_code is required`

**Solution**:
- Ensure both `tracking_number` and `courier_code` are provided
- Check that values are not empty strings

### 401 Unauthorized

**Error**: `Authentication failed (401)`

**Causes**:
- Invalid or expired API key
- API key not set in environment variables
- Wrong API key format

**Solution**:
1. Verify API key in `.env.local`:
   ```env
   NEXT_PUBLIC_TRACKINGMORE_API_KEY=your-actual-api-key-here
   ```
2. Make sure there are no quotes around the key
3. Restart the dev server
4. Get a new API key from [TrackingMore](https://www.trackingmore.com/api-doc)

### 404 Not Found

**Error**: `Tracking not found (404)`

**Causes**:
- Tracking number doesn't exist
- Wrong courier code
- Tracking hasn't been created yet

**Solution**:
- Verify the tracking number is correct
- Try creating the tracking first with `createShipmentTracking`
- Check that the courier code matches the actual carrier

### Network Errors

**Error**: `Failed to fetch` or `Network error`

**Causes**:
- No internet connection
- TrackingMore API is down
- CORS issues (shouldn't happen with server-side calls)

**Solution**:
- Check your internet connection
- Verify TrackingMore API status
- Check browser console for detailed error messages

## Debugging Tips

### 1. Check Console Logs

The improved error handling now logs detailed information:
- Request body sent to API
- Full API response
- Error codes and messages

Look in your browser console or server logs for:
```
TrackingMore API Error: {
  status: 400,
  code: 400,
  message: "...",
  requestBody: {...},
  fullResponse: {...}
}
```

### 2. Test API Key

Test your API key directly with curl:

```bash
curl --request POST \
  --url https://api.trackingmore.com/v4/trackings/create \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Tracking-Api-Key: YOUR_API_KEY" \
  --data '{
    "tracking_number": "1Z999AA10123456784",
    "courier_code": "ups"
  }'
```

### 3. Verify Environment Variables

Check that environment variables are loaded:

```typescript
// In your component or service
console.log("API Key configured:", !!process.env.NEXT_PUBLIC_TRACKINGMORE_API_KEY);
```

**Note**: In Next.js, you must restart the dev server after changing `.env.local`

### 4. Test with Known Good Data

Try with a known valid tracking number:

```
Track package 1Z999AA10123456784 with UPS
```

Or for DHL:
```
Track package 1234567890 with DHL
```

## Common Issues

### Issue: "API key is not configured"

**Solution**:
1. Create `.env.local` file in project root
2. Add: `NEXT_PUBLIC_TRACKINGMORE_API_KEY=your-key-here`
3. Restart dev server: `npm run dev`

### Issue: "Failed to parse API response"

**Solution**:
- This usually means the API returned HTML instead of JSON
- Check that your API key is valid
- Verify the API endpoint is correct
- Check TrackingMore API status

### Issue: Timeline shows "No tracking events available"

**Solution**:
- The tracking may not have events yet
- Some couriers update tracking slowly
- Wait a few minutes and try `getShipmentTracking` again
- The tracking was just created and needs time to populate

### Issue: Components not rendering

**Solution**:
- Check that Tambo API key is configured
- Verify components are registered in `src/lib/tambo.ts`
- Check browser console for errors
- Ensure you're using the `/chain-guard` page

## Getting Help

1. **Check the logs**: Look for detailed error messages in console
2. **Verify API keys**: Both Tambo and TrackingMore keys must be set
3. **Test API directly**: Use curl to test TrackingMore API
4. **Check documentation**:
   - [TrackingMore API Docs](https://www.trackingmore.com/api-doc)
   - [Tambo Docs](https://docs.tambo.co)

## Example Error Messages

### Good Error Message (with details):
```
TrackingMore API Error (400): Invalid courier code. Please check the courier code is correct.
```

### Bad Error Message (before fix):
```
API error: 400
```

The improved error handling now provides much more detail about what went wrong!

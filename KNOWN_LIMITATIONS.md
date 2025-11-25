# Known Limitations

This document outlines the current limitations and known issues when using the application in production.

## Job Monitoring

### Job Status Display May Be Flaky

The Job Monitor page (`/monitor`) displays the status of background jobs by querying the Inngest API. Due to external service dependencies, you may experience:

- **Timeout Errors**: Requests to fetch job status may timeout (30-second limit). When this occurs, you'll see "Request timed out - status unavailable"
- **Missing Run Information**: Some jobs may show "No run information available" if the Inngest API doesn't return run data for that event
- **Delayed Updates**: Job status updates are not real-time. Use the "Refresh Status" button to manually update job statuses
- **Intermittent Failures**: Network issues or Inngest API availability may cause temporary failures to load job information

**Workaround**: If you don't see job status information, try refreshing the page or clicking the "Refresh Status" button. Job functionality itself is not affected - only the monitoring display may be inconsistent.

## Analysis Performance

### Running Multiple Analyses May Result in Errors

The application uses the Gemini API for AI-powered analysis. This service has rate limits and quota restrictions:

- **Rate Limit Errors (429)**: Running multiple analyses in quick succession may trigger "Too Many Requests" errors from the Gemini API
- **Quota Exhaustion**: The free tier of Gemini API has daily limits. Exceeding these limits will cause analyses to fail
- **Timeout Risk**: Large analyses comparing many brands may take several minutes and could timeout

**Best Practices**:
- Wait for one analysis to complete before starting another
- Avoid running multiple full analyses simultaneously
- If you receive a 429 error, wait a few minutes before retrying

## Service Performance

### Limited Service Resources

All external services used by this application are on free/limited tiers:

**Expected Impact**:
- **Slower Response Times**: Initial requests may be slower due to cold starts
- **Occasional Timeouts**: Long-running operations may timeout during peak usage
- **Service Interruptions**: Free tier services may have maintenance windows or degraded performance

**Recommendations**:
- Be patient with long-running analyses (they may take 2-5 minutes)
- If an operation fails, wait a few minutes before retrying
- Avoid running intensive operations during peak hours
- Consider upgrading service tiers for production use cases

## Data Freshness

### 180-Day Data Window

All analyses are performed on plans scraped within the last 180 days. This means:

- Older historical data is not included in comparisons
- Plan availability may vary based on when they were last scraped
- Some brands may have fewer plans if they haven't been scraped recently

## Browser Compatibility

### Session Management

- Session cookies expire when the browser is closed completely
- Cookies created before the session-only update will persist for up to 7 days before the new behavior applies

---

**Note**: These limitations are primarily due to the use of free-tier services for this proof-of-concept application. For production deployment with better reliability and performance, consider upgrading to paid tiers of the respective services.

const rateLimitMap = new Map();

export function rateLimiter(request, maxRequests = 5, windowMs = 60000) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  
  const rateData = rateLimitMap.get(ip) || { count: 0, firstRequest: now };
  
  if (now - rateData.firstRequest > windowMs) {
    rateData.count = 1;
    rateData.firstRequest = now;
  } else {
    rateData.count++;
  }
  
  rateLimitMap.set(ip, rateData);
  
  return rateData.count > maxRequests;
}

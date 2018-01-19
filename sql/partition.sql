CREATE OR REPLACE VIEW sl.RequestLog as select
  id,
  accountName, [authorization],
  instanceName, isDeleted, method, params, query, requestBody, [resource], responseBody, status,
  author,
  xid, ts, cts
from sl.RequestLog1712

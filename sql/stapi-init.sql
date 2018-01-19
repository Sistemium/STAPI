grant connect to sl;
grant dba to sl;

util.setUserOption 'asamium.default.domain', 'sl';

meta.createDbspace 'sl';

meta.defineType 'resource:CODE';
meta.defineType 'params:STRING';
meta.defineType 'query:STRING';
meta.defineType 'requestBody:STRING';
meta.defineType 'responseBody:STRING';
meta.defineType 'authorization,,nullable:CODE';
meta.defineType 'method:SHORT';
meta.defineType 'status:INT';
meta.defineType 'instanceName:MEDIUM';
meta.defineType 'isDeleted:BOOL';
meta.defineType 'accountName:CODE';

meta.defineEntity 'RequestLog',
  'resource;params,,nullable;requestBody;responseBody;status;authorization;method;instanceName;isDeleted;query;accountName'
;

meta.createTable 'RequestLog',0,1, 'RequestLog1712';

create index XK_sl_RequestLog_method_ts on sl.RequestLog (method, ts);
create index XK_sl_RequestLog_resource_ts on sl.RequestLog ([resource], ts);
create index XK_sl_RequestLog_accountName_ts on sl.RequestLog (accountName, ts);

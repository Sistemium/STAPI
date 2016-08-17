grant connect to sl;
grant dba to sl;

util.setUserOption 'asamium.default.domain', 'sl';

meta.createDbspace 'sl';

meta.defineType 'resource:CODE';
meta.defineType 'params:STRING';
meta.defineType 'query:STRING';
meta.defineType 'requestBody:STRING';
meta.defineType 'responseBody:STRING';
meta.defineType 'authorization:CODE';
meta.defineType 'method:SHORT';
meta.defineType 'status:INT';
meta.defineType 'instance:MEDIUM';
meta.defineType 'isDeleted:BOOL';
meta.defineType 'accountName:CODE';

meta.defineEntity 'RequestLog',
  'resource;params;requestBody;responseBody;status;authorization;method;instance;isDeleted;query;accountName'
;

meta.createTable 'RequestLog',0,1;

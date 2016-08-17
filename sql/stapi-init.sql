grant connect to sl;
grant dba to sl;

util.setUserOption 'asamium.default.domain', 'sl';

meta.createDbspace 'sl';

meta.defineType 'resource:STRING';
meta.defineType 'params:STRING';
meta.defineType 'requestBody:STRING';
meta.defineType 'responseBody:STRING';
meta.defineType 'authorization:STRING';
meta.defineType 'method:STRING';
meta.defineType 'status:STRING';
meta.defineType 'instance:STRING';
meta.defineType 'isDeleted:BOOL';

meta.defineEntity 'RequestLog',
  'resource;params;requestBody;responseBody;status;authorization;method;instance;isDeleted'
;

meta.createTable 'RequestLog',0,1;

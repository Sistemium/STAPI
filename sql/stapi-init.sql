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

meta.defineEntity 'RequestLog',
  'resource;params;requestBody;responseBody;status;authorization;method'
;

meta.createTable 'RequestLog',0,1;

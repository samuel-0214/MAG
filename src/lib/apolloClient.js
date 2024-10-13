import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.pro-nitro-explorer-public.routernitro.com/graphql',
  cache: new InMemoryCache(),
});

export default client;

export const getSubdomains = (url: string) => {
  let domain = url;
  if (url.includes('://')) {
    domain = url.split('://')[1];
  }

  // sub1.sub2.example.com => sub1.sub2
  // sub1.example.com => sub1
  const subdomain = domain.split('.').slice(0, -2).join('.');
  return subdomain;
};

export default getSubdomains;

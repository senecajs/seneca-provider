# Assumes plugin repos checked out at same level
# (with `seneca-` prefix removed from folder name).

cd ../mixpanel-provider
npm link @seneca/provider
npm run build
npm test

cd ../nordigen-provider
npm link @seneca/provider
npm run build
npm test

cd ../gitlab-provider
npm link @seneca/provider
npm run build
npm test


cd ../provider


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type AppPlatform = 'ios' | 'android';

function toAppSettings(rule: any, platform: AppPlatform) {
  if (!rule) {
    return {
      platform,
      minVersion: '0.0.0',
      latestVersion: '0.0.0',
      enforced: false,
      forceAt: null,
      message: null,
      storeUrl: 'https://example.com'
    };
  }
  return {
    platform: rule.platform,
    minVersion: rule.minVersion,
    latestVersion: rule.latestVersion,
    enforced: rule.enforced,
    forceAt: rule.forceAt ? rule.forceAt.toISOString?.() ?? rule.forceAt : null,
    message: rule.message,
    storeUrl: rule.storeUrl
  };
}

export default {
  appSettings: async (_: any, args: { platform: AppPlatform }, ctx: any) => {
    const active = await prisma.appVersionRule.findFirst({
      where: { platform: args.platform, isActive: true }
    });
    const rule = active ?? await prisma.appVersionRule.findFirst({
      where: { platform: args.platform },
      orderBy: { createdAt: 'desc' }
    });

    ctx?.res?.set?.('Cache-Control', 'public, max-age=300');
    return toAppSettings(rule, args.platform);
  }
};

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
      storeUrl: platform === 'ios' 
        ? (process.env.IOS_APP_STORE_URL || 'https://apps.apple.com')
        : (process.env.ANDROID_PLAY_STORE_URL || 'https://play.google.com'),
      softSnoozeSeconds: 3600 // Default to 1 hour
    };
  }
  return {
    platform: rule.platform,
    minVersion: rule.minVersion,
    latestVersion: rule.latestVersion,
    enforced: rule.enforced,
    forceAt: rule.forceAt ? rule.forceAt.toISOString?.() ?? rule.forceAt : null,
    message: rule.message,
    storeUrl: rule.storeUrl?.trim() || (platform === 'ios' 
      ? (process.env.IOS_APP_STORE_URL || 'https://apps.apple.com')
      : (process.env.ANDROID_PLAY_STORE_URL || 'https://play.google.com')),
    softSnoozeSeconds: rule.softSnoozeSeconds ?? 3600 // Default to 1 hour
  };
}

export default {
  appSettings: async (_: any, args: { platform: AppPlatform }, ctx: any) => {
    const rule = await prisma.appVersionRule.findFirst({
      where: { platform: args.platform, isActive: true }
    });

    return toAppSettings(rule, args.platform);
  }
};

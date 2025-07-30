import { PrismaClient, UserType, TagType, ConfigType, LogLevel } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Master Data: Areas
  const areas = await Promise.all([
    prisma.area.upsert({
      where: { code: 'tokyo' },
      update: {},
      create: {
        name: '東京都',
        nameEn: 'Tokyo',
        code: 'tokyo',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.area.upsert({
      where: { code: 'osaka' },
      update: {},
      create: {
        name: '大阪府',
        nameEn: 'Osaka',
        code: 'osaka',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.area.upsert({
      where: { code: 'kyoto' },
      update: {},
      create: {
        name: '京都府',
        nameEn: 'Kyoto',
        code: 'kyoto',
        sortOrder: 3,
        isActive: true,
      },
    }),
  ])
  console.log('✅ Areas created:', areas.length)

  // Master Data: Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { code: 'entertainment' },
      update: {},
      create: {
        name: 'エンターテイメント',
        nameEn: 'Entertainment',
        code: 'entertainment',
        icon: '🎭',
        color: '#FF6B6B',
        description: 'エンターテイメント系サービス',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { code: 'gaming' },
      update: {},
      create: {
        name: 'ゲーミング',
        nameEn: 'Gaming',
        code: 'gaming',
        icon: '🎮',
        color: '#4ECDC4',
        description: 'ゲーム関連サービス',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { code: 'consulting' },
      update: {},
      create: {
        name: 'コンサルティング',
        nameEn: 'Consulting',
        code: 'consulting',
        icon: '💼',
        color: '#45B7D1',
        description: 'コンサルティング・相談系サービス',
        sortOrder: 3,
        isActive: true,
      },
    }),
  ])
  console.log('✅ Categories created:', categories.length)

  // Master Data: Tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: '初心者歓迎' },
      update: {},
      create: {
        name: '初心者歓迎',
        nameEn: 'Beginner Friendly',
        type: TagType.GENERAL,
        color: '#98FB98',
        description: '初心者の方でも気軽に参加できます',
        usageCount: 0,
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.tag.upsert({
      where: { name: 'プロレベル' },
      update: {},
      create: {
        name: 'プロレベル',
        nameEn: 'Professional',
        type: TagType.SKILL,
        color: '#FFD700',
        description: 'プロフェッショナルレベルのスキル',
        usageCount: 0,
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.tag.upsert({
      where: { name: 'コミュニケーション上手' },
      update: {},
      create: {
        name: 'コミュニケーション上手',
        nameEn: 'Great Communicator',
        type: TagType.PERSONALITY,
        color: '#FF69B4',
        description: 'コミュニケーション能力に長けています',
        usageCount: 0,
        sortOrder: 3,
        isActive: true,
      },
    }),
  ])
  console.log('✅ Tags created:', tags.length)

  // System Configurations
  const configs = await Promise.all([
    prisma.configuration.upsert({
      where: { key: 'platform_fee_rate' },
      update: {},
      create: {
        key: 'platform_fee_rate',
        value: '0.05',
        type: ConfigType.NUMBER,
        category: 'payment',
        description: 'プラットフォーム手数料率 (5%)',
        isRequired: true,
        isSecret: false,
      },
    }),
    prisma.configuration.upsert({
      where: { key: 'min_booking_duration' },
      update: {},
      create: {
        key: 'min_booking_duration',
        value: '30',
        type: ConfigType.NUMBER,
        category: 'booking',
        description: '最小予約時間（分）',
        isRequired: true,
        isSecret: false,
      },
    }),
    prisma.configuration.upsert({
      where: { key: 'max_booking_duration' },
      update: {},
      create: {
        key: 'max_booking_duration',
        value: '480',
        type: ConfigType.NUMBER,
        category: 'booking',
        description: '最大予約時間（分）',
        isRequired: true,
        isSecret: false,
      },
    }),
  ])
  console.log('✅ Configurations created:', configs.length)

  // Sample Users (for development)
  const sampleUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'cast1@example.com' },
      update: {},
      create: {
        email: 'cast1@example.com',
        userType: UserType.CAST,
        gender: 0, // Female
        name: 'エンタメキャスト太郎',
        castProfile: {
          create: {
            displayName: 'エンタメキャスト太郎',
            bio: 'エンターテイメント業界で10年の経験があります。楽しい時間をお約束します！',
            hourlyRate: 3000,
            availability: {},
            specialties: ['歌', 'ダンス', 'お話'],
            experience: '10年の舞台経験',
            isActive: true,
            isVerified: true,
            areaId: areas[0].id,
            categoryId: categories[0].id,
            tags: {
              connect: [{ id: tags[1].id }, { id: tags[2].id }]
            }
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'cast2@example.com' },
      update: {},
      create: {
        email: 'cast2@example.com',
        userType: UserType.CAST,
        gender: 0, // Female
        name: 'ゲーミングキャスト花子',
        castProfile: {
          create: {
            displayName: 'ゲーミングキャスト花子',
            bio: 'ゲーム実況とコメディが得意です！一緒に楽しい時間を過ごしましょう！',
            hourlyRate: 2500,
            availability: {},
            specialties: ['ゲーム実況', 'コメディ', '雑談'],
            experience: '5年の配信経験',
            isActive: true,
            isVerified: true,
            areaId: areas[1].id,
            categoryId: categories[1].id,
            tags: {
              connect: [{ id: tags[0].id }, { id: tags[2].id }]
            }
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'cast3@example.com' },
      update: {},
      create: {
        email: 'cast3@example.com',
        userType: UserType.CAST,
        gender: 0, // Female
        name: 'コンサルキャスト美咲',
        castProfile: {
          create: {
            displayName: 'コンサルキャスト美咲',
            bio: '恋愛相談から人生相談まで、どんなお悩みも親身に聞かせていただきます。',
            hourlyRate: 4000,
            availability: {},
            specialties: ['恋愛相談', '人生相談', '心理カウンセリング'],
            experience: '8年のカウンセリング経験',
            isActive: true,
            isVerified: true,
            areaId: areas[2].id,
            categoryId: categories[2].id,
            tags: {
              connect: [{ id: tags[1].id }, { id: tags[2].id }]
            }
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'cast4@example.com' },
      update: {},
      create: {
        email: 'cast4@example.com',
        userType: UserType.CAST,
        gender: 0, // Female
        name: 'アートキャスト彩',
        castProfile: {
          create: {
            displayName: 'アートキャスト彩',
            bio: '絵画やアートについて語り合いましょう！創作活動の相談も受け付けています。',
            hourlyRate: 3500,
            availability: {},
            specialties: ['アート', '絵画', '創作活動'],
            experience: '12年のアート活動',
            isActive: true,
            isVerified: true,
            areaId: areas[0].id,
            categoryId: categories[0].id,
            tags: {
              connect: [{ id: tags[0].id }, { id: tags[1].id }]
            }
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'cast5@example.com' },
      update: {},
      create: {
        email: 'cast5@example.com',
        userType: UserType.CAST,
        gender: 0, // Female
        name: '料理キャスト香',
        castProfile: {
          create: {
            displayName: '料理キャスト香',
            bio: '料理のコツやレシピを教えます！一緒に美味しい料理を作りましょう。',
            hourlyRate: 2800,
            availability: {},
            specialties: ['料理', 'レシピ', '食育'],
            experience: '15年の料理経験',
            isActive: true,
            isVerified: true,
            areaId: areas[1].id,
            categoryId: categories[2].id,
            tags: {
              connect: [{ id: tags[0].id }, { id: tags[2].id }]
            }
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'guest1@example.com' },
      update: {},
      create: {
        email: 'guest1@example.com',
        userType: UserType.GUEST,
        gender: 1, // Male
        name: 'ゲスト花子',
        guestProfile: {
          create: {
            displayName: 'ゲスト花子',
            bio: 'エンタメが大好きです！',
            preferences: {
              favoriteGenres: ['音楽', 'ダンス'],
              communicationStyle: 'friendly'
            },
            location: '東京都渋谷区',
          },
        },
      },
    }),
  ])
  console.log('✅ Sample users created:', sampleUsers.length)

  // Activity Log for seeding
  await prisma.activityLog.create({
    data: {
      action: 'DATABASE_SEEDED',
      entity: 'SYSTEM',
      description: 'Database seeding completed successfully',
      level: LogLevel.INFO,
      metadata: {
        timestamp: new Date().toISOString(),
        seedData: {
          areas: areas.length,
          categories: categories.length,
          tags: tags.length,
          configs: configs.length,
          users: sampleUsers.length,
        }
      }
    }
  })

  console.log('✅ Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Database seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
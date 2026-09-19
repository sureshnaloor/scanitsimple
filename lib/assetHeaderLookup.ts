/** Aggregation stages: attach MME or fixed-asset header onto a custody row. */
export function assetHeaderLookupStages() {
  return [
    {
      $lookup: {
        from: 'equipmentandtools',
        let: { asset: '$assetnumber' },
        pipeline: [{ $match: { $expr: { $eq: ['$assetnumber', '$$asset'] } } }],
        as: 'equipmentDetails',
      },
    },
    {
      $lookup: {
        from: 'fixedassets',
        let: { asset: '$assetnumber' },
        pipeline: [{ $match: { $expr: { $eq: ['$assetnumber', '$$asset'] } } }],
        as: 'fixedAssetDetails',
      },
    },
    {
      $addFields: {
        firstDigit: { $substr: [{ $toString: '$assetnumber' }, 0, 1] },
      },
    },
    {
      $addFields: {
        assetDetails: {
          $let: {
            vars: {
              mme: { $arrayElemAt: ['$equipmentDetails', 0] },
              fa: { $arrayElemAt: ['$fixedAssetDetails', 0] },
            },
            in: {
              $cond: {
                if: {
                  $or: [{ $eq: ['$firstDigit', '5'] }, { $eq: ['$firstDigit', '9'] }],
                },
                then: { $ifNull: ['$$mme', '$$fa'] },
                else: { $ifNull: ['$$fa', '$$mme'] },
              },
            },
          },
        },
      },
    },
  ];
}

export function isMmeAssetNumber(assetnumber: unknown): boolean {
  const first = String(assetnumber ?? '').trim().charAt(0);
  return first === '5' || first === '9';
}

export function assetPublicHref(assetnumber: unknown): string {
  const n = encodeURIComponent(String(assetnumber ?? '').trim());
  if (!n) return '/asset/';
  return isMmeAssetNumber(assetnumber) ? `/asset/${n}` : `/fixedasset/${n}`;
}

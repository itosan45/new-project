import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import type { Persona, TenantProfile } from "@/lib/domain/tenant";
import { TENANTS } from "@/lib/data/tenants";

export const metadata = { title: "仮想顧客" };

const TENANT_TONE: Tone[] = ["primary", "warn", "info"];
const TENANT_ICON = ["building", "doc", "inbox"];

const SCREEN_LABEL: Record<Persona["screen"], string> = {
  employee: "お仕事コックピット",
  ceo: "CEOアシスタント",
  admin: "運用センター",
};

const LITERACY_TONE: Record<Persona["itLiteracy"], Tone> = {
  低: "danger",
  中: "warn",
  高: "ok",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium text-ink-muted">{label}</p>
      <div className="mt-1 text-[11px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

function PersonaCard({ person }: { person: Persona }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink">
            {person.name}
            <span className="ml-1.5 font-normal text-ink-subtle">
              {person.age}
            </span>
          </p>
          <p className="text-[10px] text-ink-muted">
            {person.role}・{person.department}
          </p>
        </div>
        <Badge tone={LITERACY_TONE[person.itLiteracy]}>
          IT {person.itLiteracy}
        </Badge>
      </div>
      <Badge tone="idle">{SCREEN_LABEL[person.screen]}</Badge>
      <Field label="困っていること">{person.painPoint}</Field>
      {/* ここに答えられない限り導入されない。機能一覧より重い */}
      <Field label="警戒していること">
        <span className="text-danger">{person.concern}</span>
      </Field>
      <Field label="「使えた」の基準">
        <span className="text-ok">{person.successCriteria}</span>
      </Field>
    </div>
  );
}

function TenantSection({
  tenant,
  index,
}: {
  tenant: TenantProfile;
  index: number;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-start gap-3">
          <IconTile name={TENANT_ICON[index]} tone={TENANT_TONE[index]} />
          <div>
            <h2 className="text-base font-semibold text-ink">{tenant.name}</h2>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {tenant.industry}・{tenant.location}・従業員{tenant.employeeCount}名・
              年商{tenant.annualRevenue}
            </p>
            <p className="mt-1 font-mono text-[10px] text-ink-subtle">
              tenant_id: {tenant.tenantId}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tenant.approvalReasons.map((r) => (
            <Badge key={r} tone="warn">
              承認: {r}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 pt-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-3">
          <Field label="最初に自動化する1業務">
            <span className="font-medium">{tenant.primaryWorkflow}</span>
          </Field>
          <Field label="現状の詰まり">{tenant.bottleneck}</Field>
          <Field label="基準値（自動化前の実測）">
            <span className="tabular">{tenant.baseline}</span>
          </Field>

          <div>
            <p className="text-[10px] font-medium text-ink-muted">
              すでに使っている道具
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tenant.existingTools.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] text-ink"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* 使っている道具から、作るべきコネクタが決まる */}
          <div>
            <p className="text-[10px] font-medium text-ink-muted">
              最初に作るコネクタ
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tenant.firstConnectors.map((t) => (
                <Badge key={t} tone="primary">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-warn-soft/50 p-3">
            <p className="text-[10px] font-medium text-warn">
              この会社にとって承認ゲートが守るもの
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink">
              {tenant.approvalGatePurpose}
            </p>
          </div>

          <div className="rounded-lg bg-danger-soft/50 p-3">
            <p className="text-[10px] font-medium text-danger">
              失敗したときに起きること
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink">
              {tenant.failureCost}
            </p>
          </div>

          <div className="rounded-lg bg-ok-soft/60 p-3">
            <p className="text-[10px] font-medium text-ok">効果測定の定義</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink">
              {tenant.savingsDefinition}
            </p>
            <p className="tabular mt-1.5 text-xs font-semibold text-ok">
              {tenant.expectedMonthlySaving}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium text-ink-muted">
              この顧客がハーネスのどこを試すか
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {tenant.stressTests.map((s) => (
                <li
                  key={s}
                  className="flex gap-1.5 text-[11px] leading-relaxed text-ink"
                >
                  <Icon
                    name="check"
                    className="mt-0.5 size-3 shrink-0 text-primary"
                  />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-medium text-ink-muted">
            実際に画面を触る人
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
            {tenant.people.map((p) => (
              <PersonaCard key={p.name} person={p} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TenantsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-primary"
        >
          <Icon name="home" className="size-3" /> 画面一覧へ戻る
        </Link>
        <h1 className="text-xl font-bold text-ink">仮想顧客（3社）</h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
          「どの会社でも対応できる」を目指すと、コネクタも承認理由も効果測定も
          決められない。具体的な3社を置いて、そこから逆算する。
          3社とも承認ゲートを必要とするが、
          <span className="font-medium text-ink">
            守っているものが業種ごとに違う
          </span>
          （品質 / 責任 / 爆発半径）。同じ仕組みを横展開できる根拠はここにある。
        </p>
      </header>

      {/* 3社の違いが一目で分かる比較。設計判断はこの差から生まれる */}
      <Card className="mb-5" padded={false}>
        {/* スマホ: 会社ごとに1枚 */}
        <div className="flex flex-col divide-y divide-line sm:hidden">
          {TENANTS.map((t, i) => (
            <div key={t.tenantId} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <IconTile name={TENANT_ICON[i]} tone={TENANT_TONE[i]} size="sm" />
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-ink">{t.name}</div>
                  <div className="text-[10px] text-ink-subtle">{t.industry}</div>
                </div>
              </div>
              <Field label="最初の1業務">{t.primaryWorkflow}</Field>
              <Field label="承認ゲートが守るもの">
                {t.approvalGatePurpose.split("。")[0]}
              </Field>
              <Field label="月次削減">
                <span className="font-medium text-ok">
                  {t.expectedMonthlySaving.replace("約 ", "")}
                </span>
              </Field>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line text-[10px] text-ink-muted">
                <th className="px-4 py-2.5 font-medium">会社</th>
                <th className="px-3 py-2.5 font-medium">最初の1業務</th>
                <th className="px-3 py-2.5 font-medium">承認ゲートが守るもの</th>
                <th className="px-3 py-2.5 font-medium">試される機能</th>
                <th className="px-4 py-2.5 text-right font-medium">月次削減</th>
              </tr>
            </thead>
            <tbody>
              {TENANTS.map((t, i) => (
                <tr key={t.tenantId} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <IconTile
                        name={TENANT_ICON[i]}
                        tone={TENANT_TONE[i]}
                        size="sm"
                      />
                      <div>
                        <div className="text-xs font-medium text-ink">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-ink-subtle">
                          {t.industry}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-ink">
                    {t.primaryWorkflow}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-ink">
                    {t.approvalGatePurpose.split("。")[0]}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-ink-muted">
                    {t.stressTests[0]}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-[11px] font-medium text-ok">
                    {t.expectedMonthlySaving.replace("約 ", "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-5">
        {TENANTS.map((t, i) => (
          <TenantSection key={t.tenantId} tenant={t} index={i} />
        ))}
      </div>
    </main>
  );
}

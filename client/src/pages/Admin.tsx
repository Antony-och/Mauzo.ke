import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Activity, ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, Building2, ChevronRight, CircleDollarSign,
  ClipboardList, FileClock, LayoutDashboard, LogOut, Menu, Search, ShieldCheck,
  Users, X, MoreHorizontal, PauseCircle, PlayCircle, Settings2, ToggleLeft, ToggleRight, Package,
} from "lucide-react";
import "./admin.css";

const money = (value: string | number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(value) || 0);
const date = (value: Date | string | null) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";
const time = (value: Date | string | null) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";

type Section = "overview" | "businesses" | "users" | "audit";
const nav = [
  { key: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { key: "businesses" as const, label: "Businesses", icon: Building2 },
  { key: "users" as const, label: "Users & access", icon: Users },
  { key: "audit" as const, label: "Audit log", icon: FileClock },
];

export default function Admin() {
  const auth = useAuth();
  const [, navigate] = useLocation();
  const pathParts = window.location.pathname.split("/");
  const pathSection = pathParts[2] as Section | undefined;
  const businessDetailId = pathSection === "businesses" && pathParts[3] ? Number(pathParts[3]) : null;
  const section: Section = nav.some(item => item.key === pathSection) ? pathSection! : "overview";
  const [mobileOpen, setMobileOpen] = useState(false);
  const go = (next: Section) => { navigate(next === "overview" ? "/admin" : `/admin/${next}`); setMobileOpen(false); };

  if (auth.loading) return <div className="admin-loading"><div className="admin-mark">M</div><span>Verifying platform access…</span></div>;
  if (!auth.user) return <div className="admin-gate"><ShieldCheck size={38} /><h1>Super Admin access</h1><p>Sign in with an authorized Mauzo platform account to continue.</p><button onClick={() => startLogin()}>Continue with Manus <ArrowRight size={15} /></button></div>;
  if (auth.user.role !== "admin") return <div className="admin-gate"><ShieldCheck size={38} /><h1>Access restricted</h1><p>This area is reserved for Mauzo Super Admins. Your workspace access is unchanged.</p><button onClick={() => navigate("/app")}>Back to workspace <ArrowRight size={15} /></button></div>;

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="admin-brand"><span className="admin-mark">M</span><div><strong>mauzo</strong><small>PLATFORM CONTROL</small></div><button className="admin-close" onClick={() => setMobileOpen(false)}><X size={17} /></button></div>
      <div className="admin-context"><span className="context-icon"><BriefcaseBusiness size={15} /></span><div><b>Super Admin</b><small>Global workspace</small></div><MoreHorizontal size={15} /></div>
      <span className="admin-nav-label">COMMAND CENTER</span>
      <nav className="admin-nav">{nav.map(item => <button key={item.key} className={section === item.key ? "active" : ""} onClick={() => go(item.key)}><item.icon size={17} /><span>{item.label}</span>{section === item.key && <ChevronRight size={14} />}</button>)}</nav>
      <div className="admin-sidebar-foot"><div className="admin-status"><i /> Platform healthy<small>All core services operational</small></div><button className="admin-user" onClick={() => auth.logout()}><span>{(auth.user.name ?? "A").slice(0, 1).toUpperCase()}</span><div><b>{auth.user.name ?? "Administrator"}</b><small>{auth.user.email ?? ""}</small></div><LogOut size={14} /></button></div>
    </aside>
    {mobileOpen && <button className="admin-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <main className="admin-main">
      <header className="admin-topbar"><button className="admin-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="admin-breadcrumb"><span>Platform</span><i>/</i><b>{nav.find(item => item.key === section)?.label}</b></div><div className="admin-top-actions"><span className="admin-live"><i /> LIVE</span><button className="admin-avatar" onClick={() => auth.logout()}>{(auth.user.name ?? "A").slice(0, 1).toUpperCase()}</button></div></header>
      <div className="admin-content">{businessDetailId ? <BusinessDetail businessId={businessDetailId} /> : <>{section === "overview" && <Overview onNavigate={go} />}{section === "businesses" && <Businesses />}{section === "users" && <UsersPage />}{section === "audit" && <Audit />}</>}</div>
    </main>
  </div>;
}

function Heading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) { return <div className="admin-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{detail}</p></div>{action}</div>; }

function Overview({ onNavigate }: { onNavigate: (section: Section) => void }) {
  const query = trpc.platform.overview.useQuery();
  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError message={query.error.message} />;
  const data = query.data!;
  return <><Heading eyebrow="TUESDAY · NOVEMBER 17, 2026" title="Platform, in flow." detail="A clear view of the businesses, people, and activity running through Mauzo." action={<span className="admin-secure"><ShieldCheck size={15} /> Admin-only surface</span>} />
    <div className="admin-stat-grid"><Stat icon={<Building2 />} label="TOTAL BUSINESSES" value={data.stats.businesses} note={`${data.stats.activeBusinesses} currently active`} accent="orange" /><Stat icon={<Users />} label="REGISTERED USERS" value={data.stats.users} note="Across all workspaces" accent="green" /><Stat icon={<CircleDollarSign />} label="GROSS SALES" value={money(data.stats.grossSales)} note={`${data.stats.orders} orders recorded`} accent="blue" /><Stat icon={<Activity />} label="PLATFORM HEALTH" value="99.9%" note="All systems operational" accent="plum" /></div>
    <div className="admin-grid-two"><section className="admin-panel"><div className="admin-panel-head"><div><span>RECENT WORKSPACES</span><h2>Businesses joining Mauzo</h2></div><button onClick={() => onNavigate("businesses")}>View all <ArrowRight size={14} /></button></div><div className="admin-business-list">{data.recentBusinesses.length ? data.recentBusinesses.map(business => <div className="admin-business-row" key={business.id}><span className="business-logo">{business.name.slice(0, 1).toUpperCase()}</span><div><b>{business.name}</b><small>{business.industry} · Joined {date(business.createdAt)}</small></div><Status status={business.status} /><strong>{business.currency}</strong></div>) : <Empty text="No businesses have joined yet." />}</div></section><section className="admin-panel"><div className="admin-panel-head"><div><span>ACTIVITY STREAM</span><h2>Latest platform events</h2></div><button onClick={() => onNavigate("audit")}>Open log <ArrowRight size={14} /></button></div><div className="admin-activity-list">{data.recentAudit.length ? data.recentAudit.map(item => <div className="admin-activity-row" key={item.event.id}><span className="activity-dot" /><div><b>{item.event.action.replaceAll(".", " · ")}</b><small>{item.actorName ?? item.actorEmail ?? "System actor"} · {time(item.event.createdAt)}</small></div></div>) : <Empty text="Platform events will appear here." />}</div></section></div>
    <div className="admin-callout"><span className="callout-icon"><ShieldCheck size={19} /></span><div><b>Keep the platform trustworthy.</b><p>Business status changes and other administrative actions are written to the audit log for review.</p></div><button onClick={() => onNavigate("audit")}>Review audit trail <ArrowRight size={15} /></button></div>
  </>;
}
function Stat({ icon, label, value, note, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; note: string; accent: string }) { return <div className="admin-stat"><span className={`stat-icon ${accent}`}>{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function Businesses() {
  const [search, setSearch] = useState(""); const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [, navigate] = useLocation();
  const query = trpc.platform.businesses.useQuery({ search: search || undefined, status }); const utils = trpc.useUtils();
  const mutation = trpc.platform.setBusinessStatus.useMutation({ onSuccess: async () => { toast.success("Business status updated"); await Promise.all([utils.platform.businesses.invalidate(), utils.platform.overview.invalidate(), utils.platform.audit.invalidate()]); }, onError: error => toast.error(error.message) });
  return <><Heading eyebrow="PLATFORM DIRECTORY" title="Businesses" detail="Every Mauzo workspace, its lifecycle state, and the people it serves." action={<span className="admin-count">{query.data?.length ?? 0} records</span>} /><div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search businesses or industry" /></div><div className="admin-filters">{(["all", "active", "suspended"] as const).map(value => <button key={value} className={status === value ? "selected" : ""} onClick={() => setStatus(value)}>{value === "all" ? "All businesses" : value}</button>)}</div></div><section className="admin-table-panel"><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>BUSINESS</th><th>INDUSTRY</th><th>MEMBERS</th><th>CREATED</th><th>STATUS</th><th /></tr></thead><tbody>{query.data?.map(business => <tr key={business.id}><td><div className="table-primary"><span className="business-logo small">{business.name.slice(0, 1).toUpperCase()}</span><div><button className="table-link" onClick={() => navigate(`/admin/businesses/${business.id}`)}><b>{business.name}</b><small>#{business.id} · {business.timezone}</small></button></div></div></td><td className="capitalize">{business.industry}</td><td>{business.memberCount}</td><td>{date(business.createdAt)}</td><td><Status status={business.status} /></td><td className="table-action"><button disabled={mutation.isPending} onClick={() => mutation.mutate({ businessId: business.id, status: business.status === "active" ? "suspended" : "active" })}>{business.status === "active" ? <><PauseCircle size={14} /> Suspend</> : <><PlayCircle size={14} /> Reactivate</>}</button></td></tr>)}</tbody></table>{!query.isLoading && !query.data?.length && <Empty text="No businesses match this filter." />}</div></section></>;
}

function UsersPage() {
  const [search, setSearch] = useState(""); const query = trpc.platform.users.useQuery({ search: search || undefined }); const utils = trpc.useUtils();
  const roleMutation = trpc.platform.setUserRole.useMutation({ onSuccess: async () => { toast.success("Platform role updated"); await Promise.all([utils.platform.users.invalidate(), utils.platform.audit.invalidate()]); }, onError: error => toast.error(error.message) });
  return <><Heading eyebrow="IDENTITY & ACCESS" title="Users" detail="Platform identities and the business workspaces they belong to." action={<span className="admin-count">{query.data?.length ?? 0} records</span>} /><div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or email" /></div></div><section className="admin-table-panel"><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>PERSON</th><th>PLATFORM ROLE</th><th>WORKSPACES</th><th>JOINED</th><th>LAST ACTIVE</th><th /></tr></thead><tbody>{query.data?.map(user => <tr key={user.id}><td><div className="table-primary"><span className="user-logo">{(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}</span><div><b>{user.name ?? "Unnamed user"}</b><small>{user.email ?? "No email provided"}</small></div></div></td><td><select className="role-select" value={user.role} disabled={roleMutation.isPending} onChange={event => roleMutation.mutate({ userId: user.id, role: event.target.value as "user" | "admin" })}><option value="user">Platform user</option><option value="admin">Super Admin</option></select></td><td>{user.membershipCount}</td><td>{date(user.createdAt)}</td><td>{time(user.lastSignedIn)}</td><td className="table-action"><span className={`role-pill ${user.role}`}>{user.role === "admin" ? "Elevated" : "Standard"}</span></td></tr>)}</tbody></table>{!query.isLoading && !query.data?.length && <Empty text="No users match this search." />}</div></section></>;
}

function BusinessDetail({ businessId }: { businessId: number }) {
  const [, navigate] = useLocation();
  const query = trpc.platform.businessDetail.useQuery({ businessId }); const utils = trpc.useUtils();
  const toggle = trpc.platform.setBusinessModule.useMutation({ onSuccess: async () => { toast.success("Module configuration saved"); await Promise.all([utils.platform.businessDetail.invalidate({ businessId }), utils.platform.audit.invalidate()]); }, onError: error => toast.error(error.message) });
  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError message={query.error.message} />;
  const data = query.data!; const enabled = new Set(data.modules.filter(item => item.enabled).map(item => item.moduleKey));
  const moduleKeys = ["pos", "orders", "inventory", "suppliers", "reports", "staff", "branches", "kitchen"];
  return <><button className="back-link" onClick={() => navigate("/admin/businesses")}><ArrowLeft size={14} /> Back to businesses</button><Heading eyebrow="BUSINESS CONTROL" title={data.business.name} detail={`${data.business.industry} · workspace #${data.business.id} · ${data.business.timezone}`} action={<Status status={data.business.status} />} />
    <div className="admin-stat-grid business-detail-stats"><Stat icon={<CircleDollarSign />} label="GROSS SALES" value={money(data.revenue)} note={`${data.orders} orders recorded`} accent="orange" /><Stat icon={<Users />} label="TEAM MEMBERS" value={data.members.length} note="Active and invited access" accent="green" /><Stat icon={<Package />} label="ACTIVE PRODUCTS" value={data.productCount} note="Catalog records" accent="blue" /><Stat icon={<Building2 />} label="BRANCHES" value={data.branches.length} note="Operating locations" accent="plum" /></div>
    <div className="detail-grid"><section className="admin-panel"><div className="admin-panel-head"><div><span>WORKSPACE CONFIGURATION</span><h2>Enabled modules</h2></div><Settings2 size={17} className="panel-muted-icon" /></div><p className="panel-description">Platform-level controls are applied to this workspace and recorded in the audit trail.</p><div className="module-control-grid">{moduleKeys.map(key => { const isEnabled = enabled.has(key); return <button key={key} className={`module-control ${isEnabled ? "enabled" : "disabled"}`} disabled={toggle.isPending} onClick={() => toggle.mutate({ businessId, moduleKey: key, enabled: !isEnabled })}><span>{isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</span><div><b>{key.replaceAll("_", " ")}</b><small>{isEnabled ? "Enabled for this workspace" : "Currently unavailable"}</small></div></button>; })}</div></section><section className="admin-panel"><div className="admin-panel-head"><div><span>WORKSPACE PEOPLE</span><h2>Members & access</h2></div><Users size={17} className="panel-muted-icon" /></div><div className="detail-list">{data.members.length ? data.members.map(item => <div className="detail-row" key={item.membership.id}><span className="user-logo">{(item.user.name ?? item.user.email ?? "U").slice(0, 1).toUpperCase()}</span><div><b>{item.user.name ?? "Unnamed user"}</b><small>{item.user.email ?? "No email provided"}</small></div><span className={`role-pill ${item.membership.role === "owner" ? "admin" : "user"}`}>{item.membership.role.replaceAll("_", " ")}</span></div>) : <Empty text="No members found." />}</div></section></div>
    <section className="admin-panel detail-panel"><div className="admin-panel-head"><div><span>OPERATING LOCATIONS</span><h2>Branches</h2></div><Building2 size={17} className="panel-muted-icon" /></div><div className="branch-detail-grid">{data.branches.length ? data.branches.map(branch => <div className="branch-detail-card" key={branch.id}><span className="branch-icon"><Building2 size={16} /></span><div><b>{branch.name}</b><small>{branch.address ?? "No address provided"}</small></div>{branch.isDefault && <span className="default-pill">Default</span>}</div>) : <Empty text="No branches found." />}</div></section>
  </>;
}

function Audit() { const query = trpc.platform.audit.useQuery({ limit: 100 }); return <><Heading eyebrow="GOVERNANCE" title="Audit log" detail="A durable record of platform and business administration events." action={<span className="admin-secure"><ShieldCheck size={15} /> Immutable activity trail</span>} /><section className="admin-table-panel audit-panel"><div className="audit-intro"><span className="audit-icon"><ClipboardList size={18} /></span><div><b>Administrative activity</b><p>Events are recorded with an actor and timestamp whenever platform controls change.</p></div></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>EVENT</th><th>ACTOR</th><th>ENTITY</th><th>WHEN</th></tr></thead><tbody>{query.data?.map(item => <tr key={item.event.id}><td><div className="event-cell"><span className="activity-dot" /><b>{item.event.action.replaceAll(".", " · ")}</b></div></td><td>{item.actorName ?? item.actorEmail ?? "System actor"}</td><td className="capitalize">{item.event.entityType}{item.event.entityId ? ` #${item.event.entityId}` : ""}</td><td>{time(item.event.createdAt)}</td></tr>)}</tbody></table>{!query.isLoading && !query.data?.length && <Empty text="No audit events yet." />}</div></section></>; }
function Status({ status }: { status: string }) { return <span className={`status-pill ${status}`}><i />{status}</span>; }
function Empty({ text }: { text: string }) { return <div className="admin-empty">{text}</div>; }
function AdminLoading() { return <div className="admin-loading-inline"><div className="admin-spinner" />Loading platform data…</div>; }
function AdminError({ message }: { message: string }) { return <div className="admin-error"><ShieldCheck size={17} /><div><b>Couldn’t load platform data</b><p>{message}</p></div></div>; }

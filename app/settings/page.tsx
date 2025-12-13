import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    Camera,
    Eye,
    Globe,
    Lock,
    LogOut,
    Palette,
    Shield,
    User,
    Users,
} from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="container py-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-3xl">
                <h1 className="font-display text-3xl font-bold">Ayarlar</h1>
                <p className="mt-2 text-muted-foreground">
                    Hesap ve gizlilik ayarlarını yönet
                </p>

                <Tabs defaultValue="profile" className="mt-8">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">Profil</span>
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Gizlilik</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">Bildirimler</span>
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="gap-2">
                            <Palette className="h-4 w-4" />
                            <span className="hidden sm:inline">Görünüm</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="mt-6 space-y-6">
                        {/* Avatar */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Profil Fotoğrafı</CardTitle>
                                <CardDescription>
                                    Profilinde görünecek fotoğrafı yükle
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarFallback className="text-2xl">JD</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Camera className="h-4 w-4" />
                                            Fotoğraf Yükle
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            JPG, PNG veya GIF. Max 2MB.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Temel Bilgiler</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Görünen Ad</label>
                                        <Input placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Kullanıcı Adı</label>
                                        <Input placeholder="johndoe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bio</label>
                                    <Input placeholder="Kendinden bahset..." />
                                </div>
                                <Button variant="neon">Kaydet</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Privacy Tab */}
                    <TabsContent value="privacy" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gizlilik Ayarları</CardTitle>
                                <CardDescription>
                                    İçeriklerinin kimler tarafından görülebileceğini ayarla
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Watched privacy */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Eye className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">İzlediklerim</p>
                                            <p className="text-sm text-muted-foreground">
                                                İzlediğin filmler ve diziler
                                            </p>
                                        </div>
                                    </div>
                                    <PrivacySelector value="public" />
                                </div>

                                {/* Watchlist privacy */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Eye className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">İzleme Listem</p>
                                            <p className="text-sm text-muted-foreground">
                                                İzlemek istediğin filmler
                                            </p>
                                        </div>
                                    </div>
                                    <PrivacySelector value="followers" />
                                </div>

                                {/* Elo stats */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Eye className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Elo İstatistikleri</p>
                                            <p className="text-sm text-muted-foreground">
                                                VS modundaki sıralama puanların
                                            </p>
                                        </div>
                                    </div>
                                    <PrivacySelector value="public" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Blocked users */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Engellenen Kullanıcılar</CardTitle>
                                <CardDescription>
                                    Engellediğin kullanıcılar seni göremez
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Henüz kimseyi engellemedi.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bildirim Ayarları</CardTitle>
                                <CardDescription>
                                    Hangi bildirimler almak istediğini seç
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <NotificationSetting
                                    title="Yeni takipçi"
                                    description="Biri seni takip ettiğinde"
                                    enabled={true}
                                />
                                <NotificationSetting
                                    title="Beğeniler"
                                    description="Birisi listeni veya incelemeni beğendiğinde"
                                    enabled={true}
                                />
                                <NotificationSetting
                                    title="Yorumlar"
                                    description="Birisi listene veya incelemene yorum yaptığında"
                                    enabled={true}
                                />
                                <NotificationSetting
                                    title="Yanıtlar"
                                    description="Birisi yorumuna yanıt verdiğinde"
                                    enabled={true}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Görünüm</CardTitle>
                                <CardDescription>
                                    Uygulama görünümünü özelleştir
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Tema</p>
                                        <p className="text-sm text-muted-foreground">
                                            CineTier şu anda sadece koyu temayı destekliyor
                                        </p>
                                    </div>
                                    <Badge variant="secondary">Koyu</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Danger zone */}
                <Card className="mt-8 border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Çıkış Yap</p>
                            <p className="text-sm text-muted-foreground">
                                Hesabından çıkış yap
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PrivacySelector({ value }: { value: "public" | "followers" | "private" }) {
    const options = [
        { value: "public", label: "Herkes", icon: Globe },
        { value: "followers", label: "Takipçiler", icon: Users },
        { value: "private", label: "Sadece Ben", icon: Lock },
    ];

    const selected = options.find((o) => o.value === value) || options[0];
    const Icon = selected.icon;

    return (
        <Button variant="outline" size="sm" className="gap-2">
            <Icon className="h-4 w-4" />
            {selected.label}
        </Button>
    );
}

function NotificationSetting({
    title,
    description,
    enabled,
}: {
    title: string;
    description: string;
    enabled: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div
                className={`h-6 w-11 rounded-full transition-colors ${enabled ? "bg-neon" : "bg-surface-2"
                    }`}
            >
                <div
                    className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                />
            </div>
        </div>
    );
}

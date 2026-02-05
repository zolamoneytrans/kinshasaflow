'use client';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, AreaChart, DollarSign, University, Hospital, Car, Route, TrendingUp, Lightbulb, UserCircle, Map } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statsData = {
  general: {
    population: "17 Million (Estimation 2024)",
    area: "9,965 km²",
    density: "1,706 hab./km²",
    governor: "Gentiny Ngobila Mbaka",
    governorImage: "https://picsum.photos/seed/gentiny-ngobila/200/200",
  },
  communes: [
    "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu", "Kasa-Vubu", "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso", "Lemba", "Limete", "Lingwala", "Makala", "Maluku", "Masina", "Matete", "Mont-Ngafula", "N'djili", "N'sele", "Ngaba", "Ngaliema", "Ngiri-Ngiri", "Selembao"
  ],
  economy: {
    gdp: "Approx. 55 Milliards USD (Ville-province)",
    keySectors: ["Services", "Commerce", "Construction", "Industrie légère", "Transport"],
  },
  projections: {
    economicGrowth: "+4.5% (prévision 2026)",
    focusAreas: ["Infrastructures numériques", "Transport urbain", "Énergies renouvelables"],
  },
  infrastructure: {
    universities: "Plus de 50 institutions",
    hospitals: "Plus de 300 centres de santé et hôpitaux",
  },
  transport: {
    mainRoads: "Blvd. Lumumba, Blvd. du 30 Juin, Av. Kasa-Vubu",
    vehicles: "Plus de 1.2 million de véhicules (estimation)",
  }
};

const populationChartData = [
  { year: "2020", "Population (Millions)": 14.3 },
  { year: "2024", "Population (Millions)": 17.0 },
  { year: "2026", "Population (Millions)": 18.5 },
  { year: "2030", "Population (Millions)": 21.7 },
];

const chartConfig = {
  population: {
    label: "Population (Millions)",
    color: "hsl(var(--primary))",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
        duration: 0.5
    }
  },
};

export default function KinshasaStats() {
  return (
    <div className="w-full h-full overflow-y-auto pr-2">
      <Tabs defaultValue="apercu" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="communes">Communes</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="infrastructures">Infrastructures</TabsTrigger>
          <TabsTrigger value="economie-avenir">Économie & Avenir</TabsTrigger>
        </TabsList>
        
        <motion.div
          key="apercu"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <TabsContent value="apercu" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="text-primary" />
                    Démographie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Population</p>
                    <p className="text-muted-foreground">{statsData.general.population}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Superficie</p>
                    <p className="text-muted-foreground">{statsData.general.area}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Densité</p>
                    <p className="text-muted-foreground">{statsData.general.density}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCircle className="text-primary" />
                            Gouverneur de la ville
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Image src={statsData.general.governorImage} alt="Gouverneur de Kinshasa" width={80} height={80} className="rounded-full border-2 border-primary" data-ai-hint="official portrait" />
                        <div>
                            <p className="font-bold text-lg">{statsData.general.governor}</p>
                            <p className="text-muted-foreground">Gouverneur de la ville-province de Kinshasa</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
          </TabsContent>
        </motion.div>

        <motion.div
          key="communes"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="communes">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="text-primary" />
                    Les 24 Communes
                  </CardTitle>
                  <CardDescription>Kinshasa est divisée en 24 communes administratives.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {statsData.communes.map(commune => (
                      <div key={commune} className="p-3 rounded-lg border bg-muted/30 text-sm font-medium hover:bg-accent transition-colors cursor-default">
                        {commune}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>


        <motion.div
          key="transport"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="transport">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="text-primary" />
                    Transport
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Véhicules (est.)</p>
                    <p className="text-muted-foreground">{statsData.transport.vehicles}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                      <p className="font-semibold mb-2">Artères Principales</p>
                      <div className="flex flex-wrap gap-2">
                          {statsData.transport.mainRoads.split(', ').map(road => (
                              <div key={road} className="text-xs flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full"><Route className="h-3 w-3" />{road}</div>
                          ))}
                      </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>

        <motion.div
          key="infrastructures"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="infrastructures">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="text-primary" />
                    Infrastructures Sociales
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <University className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{statsData.infrastructure.universities}</p>
                      <p className="text-muted-foreground">Universités & Instituts Supérieurs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="bg-success/10 text-success p-3 rounded-full">
                      <Hospital className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{statsData.infrastructure.hospitals}</p>
                      <p className="text-muted-foreground">Hôpitaux & Centres de Santé</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>

        <motion.div
          key="economie-avenir"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <TabsContent value="economie-avenir">
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="text-success" />
                      Économie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="font-semibold mb-1">PIB (estimation)</p>
                        <p className="text-2xl font-bold text-success">{statsData.economy.gdp}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="font-semibold mb-2">Secteurs Clés</p>
                        <div className="flex flex-wrap gap-2">
                            {statsData.economy.keySectors.map(sector => (
                                <div key={sector} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{sector}</div>
                            ))}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants} className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AreaChart className="text-primary" />
                            Projections & Avenir
                        </CardTitle>
                        <CardDescription>Croissance démographique et axes de développement futurs.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid lg:grid-cols-2 gap-6 items-center">
                        <div className="h-[250px] w-full">
                          <p className="text-sm font-semibold text-foreground mb-2">Croissance de la Population</p>
                          <ChartContainer config={chartConfig} className="w-full h-full">
                              <BarChart accessibilityLayer data={populationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                  <YAxis unit="M" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                  <ChartTooltip 
                                      cursor={false} 
                                      content={<ChartTooltipContent indicator="dot" />}
                                  />
                                  <Bar dataKey="Population (Millions)" name="Population" fill="hsl(var(--primary))" radius={4} />
                              </BarChart>
                          </ChartContainer>
                        </div>
                         <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-lg border">
                              <div className="bg-primary/10 text-primary p-3 rounded-full">
                                <TrendingUp className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-bold text-xl">{statsData.projections.economicGrowth}</p>
                                <p className="text-muted-foreground">Croissance économique attendue</p>
                              </div>
                            </div>
                            <div className="p-4 rounded-lg border">
                                <p className="font-semibold mb-3 flex items-center gap-2"><Lightbulb className="text-primary h-5 w-5"/> Axes de Développement</p>
                                <div className="flex flex-wrap gap-2">
                                    {statsData.projections.focusAreas.map(area => (
                                        <div key={area} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{area}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </motion.div>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
